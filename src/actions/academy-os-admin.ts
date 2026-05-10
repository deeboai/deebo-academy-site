"use server";

import { revalidatePath } from "next/cache";

import {
  sendAcademyIntakeConfirmationEmail,
  sendAcademyIntakeNotificationEmail,
  sendAcademyPortalInviteEmail,
  sendAcademyPortalPasswordResetEmail,
  sendAcademySessionRecapEmail,
  sendAcademySessionScheduledEmail,
} from "@/lib/email";
import { requireAcademyAdminUser } from "@/lib/auth/academy-admin";
import { getSupabaseServiceClient } from "@/lib/supabase/service";
import { insertAcademyAuditEvent } from "@/lib/academy-audit";
import { hasGoogleCalendarAutomationEnv } from "@/lib/env";
import {
  getAcademyEmailLogById,
  getAcademyIntakeSubmissionById,
  getAcademyPortalAccountByEntity,
  getAcademyPortalAccountById,
  getAcademyPaymentById,
  getAcademyParentById,
  getAcademyParentByEmail,
  getAcademyRecordingBySessionId,
  getAcademySessionById,
  getAcademySessionNoteById,
  getAcademyStudentById,
  getAcademyStudentSubjectById,
  getAcademyTutorById,
  type AcademyPortalAccountRole,
} from "@/lib/academy-data";
import { syncAcademyGoogleCalendarEvent } from "@/lib/google-calendar";
import { ACADEMY_FORMAT_OPTIONS, ACADEMY_SUBJECTS } from "@/content/academy-content";
import {
  type AcademyIntakeStatus,
  isAcademyIntakeStatus,
} from "@/lib/academy-intake";
import {
  isAcademyPaymentStatus,
  isAcademySessionNoteStatus,
  isAcademySessionStatus,
} from "@/lib/academy-os";
import {
  buildParentRecordingAccessPath,
  getExtendedRecordingExpiryIso,
  isParentVisibleRecordingActive,
} from "@/lib/academy-recordings";
import { sanitizeEmailAddress, sanitizeMultilineText, sanitizePlainText } from "@/lib/input-security";

function requireFormValue(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();

  if (!value) {
    throw new Error(`Missing required field: ${key}.`);
  }

  return value;
}

function optionalFormValue(formData: FormData, key: string, maxLength = 500) {
  const value = sanitizeMultilineText(String(formData.get(key) ?? ""), { maxLength });
  return value || null;
}

function requireHttpsOrHttpUrl(value: string, fieldName: string) {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(value);
  } catch {
    throw new Error(`${fieldName} must be a valid URL.`);
  }

  if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
    throw new Error(`${fieldName} must start with http:// or https://.`);
  }

  return parsedUrl.toString();
}

function revalidateAdminPaths(paths: string[]) {
  for (const routePath of paths) {
    revalidatePath(routePath);
  }
}

async function synchronizeAcademySessionCalendarEvent(input: {
  sessionId: string;
  actor: Awaited<ReturnType<typeof requireAcademyAdminUser>>;
  throwOnFailure?: boolean;
}) {
  if (!hasGoogleCalendarAutomationEnv) {
    return {
      skipped: true,
      reason: "env_incomplete",
    } as const;
  }

  try {
    const session = await getAcademySessionById(input.sessionId);

    if (!session?.student_id || !session.parent_id) {
      throw new Error("The session is missing linked student or parent data.");
    }

    const [parent, student, tutor] = await Promise.all([
      getAcademyParentById(session.parent_id),
      getAcademyStudentById(session.student_id),
      session.tutor_id ? getAcademyTutorById(session.tutor_id) : Promise.resolve(null),
    ]);

    if (!parent || !student) {
      throw new Error("The linked parent or student record was not found.");
    }

    const syncResult = await syncAcademyGoogleCalendarEvent({
      session,
      parent,
      student,
      tutor,
    });

    const supabase = getSupabaseServiceClient() as any;
    const { error } = await supabase
      .from("academy_sessions")
      .update({
        google_calendar_event_id: syncResult.eventId,
        meeting_url: syncResult.meetingUrl,
      })
      .eq("id", session.id);

    if (error) {
      throw error;
    }

    await insertAcademyAuditEvent({
      actor: input.actor,
      action: "session.calendar_synced",
      targetType: "academy_session",
      targetId: session.id,
      details: {
        googleCalendarEventId: syncResult.eventId,
        createdConferenceLink: syncResult.createdConferenceLink,
        hasMeetingUrl: Boolean(syncResult.meetingUrl),
      },
    });

    return {
      skipped: false,
      result: syncResult,
    } as const;
  } catch (error) {
    await insertAcademyAuditEvent({
      actor: input.actor,
      action: "session.calendar_sync_failed",
      targetType: "academy_session",
      targetId: input.sessionId,
      details: {
        message: error instanceof Error ? error.message : "Unknown Google Calendar sync failure.",
      },
    });

    if (input.throwOnFailure) {
      throw error;
    }

    console.error("Academy Google Calendar sync failed", error);

    return {
      skipped: true,
      reason: "sync_failed",
    } as const;
  }
}

function requireNonNegativeInteger(value: string, fieldName: string) {
  const parsedValue = Number.parseInt(value, 10);

  if (!Number.isFinite(parsedValue) || parsedValue < 0) {
    throw new Error(`${fieldName} must be a non-negative integer.`);
  }

  return parsedValue;
}

function normalizeOptionalPaymentStatus(rawValue: string | null | undefined) {
  // Sessions and payments now share the same controlled payment status vocabulary.
  const value = sanitizePlainText(rawValue ?? "pending", { maxLength: 40 }) || "pending";

  if (!isAcademyPaymentStatus(value)) {
    throw new Error("Invalid payment status.");
  }

  return value;
}

function getNormalizedDateRange(formData: FormData) {
  // Normalize here so downstream writes and emails use the same validated timestamps.
  const startsAt = new Date(requireFormValue(formData, "starts_at"));
  const endsAt = new Date(requireFormValue(formData, "ends_at"));

  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
    throw new Error("Session start and end times must be valid dates.");
  }

  if (startsAt >= endsAt) {
    throw new Error("Session end time must be later than session start time.");
  }

  return {
    startsAtIso: startsAt.toISOString(),
    endsAtIso: endsAt.toISOString(),
  };
}

function getPortalRedirectPath(role: AcademyPortalAccountRole) {
  switch (role) {
    case "admin":
      return "/admin";
    case "parent":
      return "/parent";
    case "tutor":
      return "/tutor";
    case "student":
      return "/student";
    default:
      return "/login";
  }
}

function getAcademyBaseUrl() {
  const configuredUrl =
    process.env.NEXT_PUBLIC_ACADEMY_SITE_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.URL ??
    process.env.DEPLOY_PRIME_URL ??
    "";

  return configuredUrl.replace(/\/$/, "");
}

function getPortalAccountEntity(role: AcademyPortalAccountRole, entityId: string | null) {
  return {
    parent_id: role === "parent" ? entityId : null,
    tutor_id: role === "tutor" ? entityId : null,
    student_id: role === "student" ? entityId : null,
  };
}

function formatSessionDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatDateOnly(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function getIntakeSubjectLabel(subject: string) {
  return ACADEMY_SUBJECTS.find((candidate) => candidate.value === subject)?.label ?? subject;
}

function getIntakeFormatLabel(format: string) {
  return ACADEMY_FORMAT_OPTIONS.find((candidate) => candidate.value === format)?.label ?? format;
}

async function getPortalAccountDisplayName(account: Awaited<ReturnType<typeof getAcademyPortalAccountById>>) {
  if (!account) {
    return "Academy user";
  }

  if (account.parent_id) {
    const parent = await getAcademyParentById(account.parent_id);
    return parent?.full_name ?? account.email;
  }

  if (account.tutor_id) {
    const tutor = await getAcademyTutorById(account.tutor_id);
    return tutor?.full_name ?? account.email;
  }

  if (account.student_id) {
    const student = await getAcademyStudentById(account.student_id);
    return student ? `${student.first_name}${student.last_name ? ` ${student.last_name}` : ""}` : account.email;
  }

  return account.email;
}

async function generatePortalAccountActionLink(input: {
  account: NonNullable<Awaited<ReturnType<typeof getAcademyPortalAccountById>>>;
  type: "invite" | "recovery";
}) {
  const supabase = getSupabaseServiceClient() as any;
  const baseUrl = getAcademyBaseUrl();
  const redirectTo =
    input.type === "invite"
      ? baseUrl
        ? `${baseUrl}${getPortalRedirectPath(input.account.role)}`
        : undefined
      : baseUrl
        ? `${baseUrl}/login`
        : undefined;
  const { data, error } = await supabase.auth.admin.generateLink({
    type: input.type,
    email: input.account.email,
    options: {
      redirectTo,
      data: {
        academy_role: input.account.role,
        academy_account_id: input.account.id,
      },
    },
  });

  if (error) {
    throw error;
  }

  const actionLink = data?.properties?.action_link;

  if (!actionLink) {
    throw new Error("Supabase did not return an action link for this email workflow.");
  }

  if (data?.user?.id) {
    await supabase
      .from("academy_portal_accounts")
      .update({
        auth_user_id: data.user.id,
      })
      .eq("id", input.account.id);
  }

  return {
    actionLink,
    redirectTo: redirectTo ?? null,
  };
}

async function deliverPortalInviteEmail(input: {
  account: NonNullable<Awaited<ReturnType<typeof getAcademyPortalAccountById>>>;
  actor: Awaited<ReturnType<typeof requireAcademyAdminUser>>;
}) {
  const recipientName = await getPortalAccountDisplayName(input.account);
  const { actionLink, redirectTo } = await generatePortalAccountActionLink({
    account: input.account,
    type: "invite",
  });
  const emailResult = await sendAcademyPortalInviteEmail({
    recipientEmail: input.account.email,
    recipientName,
    role: input.account.role,
    actionLink,
    accountId: input.account.id,
  });

  if (!emailResult.sent) {
    throw new Error("Academy email env is incomplete, so the invite email was not sent.");
  }

  const supabase = getSupabaseServiceClient() as any;
  await supabase
    .from("academy_portal_accounts")
    .update({
      invited_by: input.actor.id,
      invite_sent_at: new Date().toISOString(),
      status: "invited",
      disabled_at: null,
    })
    .eq("id", input.account.id);

  await insertAcademyAuditEvent({
    actor: input.actor,
    action: "portal_account.invited",
    targetType: "academy_portal_account",
    targetId: input.account.id,
    targetEmail: input.account.email,
    details: { role: input.account.role, redirectTo },
  });
}

async function deliverPortalPasswordResetEmail(input: {
  account: NonNullable<Awaited<ReturnType<typeof getAcademyPortalAccountById>>>;
  actor: Awaited<ReturnType<typeof requireAcademyAdminUser>>;
}) {
  const recipientName = await getPortalAccountDisplayName(input.account);
  const { actionLink, redirectTo } = await generatePortalAccountActionLink({
    account: input.account,
    type: "recovery",
  });
  const emailResult = await sendAcademyPortalPasswordResetEmail({
    recipientEmail: input.account.email,
    recipientName,
    role: input.account.role,
    actionLink,
    accountId: input.account.id,
  });

  if (!emailResult.sent) {
    throw new Error("Academy email env is incomplete, so the password reset email was not sent.");
  }

  const supabase = getSupabaseServiceClient() as any;
  await supabase
    .from("academy_portal_accounts")
    .update({
      password_reset_sent_at: new Date().toISOString(),
    })
    .eq("id", input.account.id);

  await insertAcademyAuditEvent({
    actor: input.actor,
    action: "portal_account.password_reset_generated",
    targetType: "academy_portal_account",
    targetId: input.account.id,
    targetEmail: input.account.email,
    details: { role: input.account.role, redirectTo },
  });
}

async function buildScheduledSessionEmailPayload(sessionId: string) {
  const session = await getAcademySessionById(sessionId);

  if (!session || !session.parent_id || !session.student_id) {
    throw new Error("The selected session is missing linked parent or student data.");
  }

  const [parent, student, tutor] = await Promise.all([
    getAcademyParentById(session.parent_id),
    getAcademyStudentById(session.student_id),
    session.tutor_id ? getAcademyTutorById(session.tutor_id) : Promise.resolve(null),
  ]);

  if (!parent || !student) {
    throw new Error("The linked parent or student record was not found.");
  }

  return {
    session,
    parent,
    student,
    tutor,
    emailInput: {
      parentEmail: parent.email,
      parentName: parent.full_name,
      studentName: `${student.first_name}${student.last_name ? ` ${student.last_name}` : ""}`,
      sessionDateLabel: formatSessionDateTime(session.starts_at),
      subject: session.subject,
      courseName: session.course_name,
      tutorName: tutor?.full_name ?? null,
      meetingUrl: session.meeting_url,
      sessionId: session.id,
    },
  };
}

async function deliverScheduledSessionEmail(sessionId: string) {
  const payload = await buildScheduledSessionEmailPayload(sessionId);
  const emailResult = await sendAcademySessionScheduledEmail(payload.emailInput);

  if (!emailResult.sent) {
    throw new Error("Academy email env is incomplete, so the scheduling email was not sent.");
  }

  return payload;
}

async function buildSessionRecapEmailPayload(noteId: string) {
  const note = await getAcademySessionNoteById(noteId);

  if (!note || !note.session_id) {
    throw new Error("The selected session note was not found.");
  }

  if (note.admin_status !== "validated" && note.admin_status !== "emailed") {
    throw new Error("Validate the session note before sending the parent recap.");
  }

  const session = await getAcademySessionById(note.session_id);

  if (!session || !session.parent_id || !session.student_id) {
    throw new Error("The linked session is missing parent or student data.");
  }

  const [parent, student, recording] = await Promise.all([
    getAcademyParentById(session.parent_id),
    getAcademyStudentById(session.student_id),
    getAcademyRecordingBySessionId(session.id),
  ]);
  const academyBaseUrl = getAcademyBaseUrl();

  if (!parent || !student) {
    throw new Error("The linked parent or student record was not found.");
  }

  const supabase = getSupabaseServiceClient() as any;
  const { data: nextSessionData } = await supabase
    .from("academy_sessions")
    .select("starts_at")
    .eq("student_id", student.id)
    .gt("starts_at", session.starts_at)
    .order("starts_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return {
    note,
    session,
    parent,
    emailInput: {
      parentEmail: parent.email,
      parentName: parent.full_name,
      studentName: `${student.first_name}${student.last_name ? ` ${student.last_name}` : ""}`,
      sessionDateLabel: formatSessionDateTime(session.starts_at),
      subject: session.subject,
      courseName: session.course_name,
      whatWasCovered: note.what_was_covered,
      studentUnderstood: note.student_understood,
      studentStruggledWith: note.student_struggled_with,
      recommendedHomework: note.recommended_homework,
      // Parent recap emails now point back into the authenticated Academy portal instead of exposing the raw vendor URL.
      recordingUrl:
        recording && isParentVisibleRecordingActive(recording) && academyBaseUrl
          ? `${academyBaseUrl}${buildParentRecordingAccessPath(session.id)}`
          : null,
      recordingExpirationLabel: recording ? formatDateOnly(recording.expires_at) : null,
      nextSessionLabel: nextSessionData?.starts_at ? formatSessionDateTime(nextSessionData.starts_at) : null,
      noteId,
    },
  };
}

async function deliverSessionRecapEmail(noteId: string) {
  const payload = await buildSessionRecapEmailPayload(noteId);
  const emailResult = await sendAcademySessionRecapEmail(payload.emailInput);

  if (!emailResult.sent) {
    throw new Error("Academy email env is incomplete, so the recap email was not sent.");
  }

  return payload;
}

async function resendLoggedEmail(logId: string, actor: Awaited<ReturnType<typeof requireAcademyAdminUser>>) {
  const log = await getAcademyEmailLogById(logId);

  if (!log) {
    throw new Error("The selected email log entry was not found.");
  }

  switch (log.template) {
    case "portal-invite": {
      if (!log.related_id) {
        throw new Error("The logged invite email is missing its portal account reference.");
      }

      const account = await getAcademyPortalAccountById(log.related_id);

      if (!account) {
        throw new Error("The linked portal account no longer exists.");
      }

      await deliverPortalInviteEmail({ account, actor });
      return;
    }
    case "portal-password-reset": {
      if (!log.related_id) {
        throw new Error("The logged password reset email is missing its portal account reference.");
      }

      const account = await getAcademyPortalAccountById(log.related_id);

      if (!account) {
        throw new Error("The linked portal account no longer exists.");
      }

      await deliverPortalPasswordResetEmail({ account, actor });
      return;
    }
    case "session-scheduled": {
      if (!log.related_id) {
        throw new Error("The logged scheduling email is missing its session reference.");
      }

      await deliverScheduledSessionEmail(log.related_id);
      await insertAcademyAuditEvent({
        actor,
        action: "session.scheduled_email_resent",
        targetType: "academy_session",
        targetId: log.related_id,
        targetEmail: log.recipient,
        details: { emailLogId: log.id },
      });
      return;
    }
    case "session-recap": {
      if (!log.related_id) {
        throw new Error("The logged recap email is missing its session note reference.");
      }

      const payload = await deliverSessionRecapEmail(log.related_id);
      await insertAcademyAuditEvent({
        actor,
        action: "session_note.recap_resent",
        targetType: "academy_session_note",
        targetId: log.related_id,
        targetEmail: payload.parent.email,
        details: { emailLogId: log.id, sessionId: payload.session.id },
      });
      return;
    }
    case "intake-confirmation":
    case "intake-notification": {
      if (!log.related_id) {
        throw new Error("The logged intake email is missing its intake reference.");
      }

      const submission = await getAcademyIntakeSubmissionById(log.related_id);

      if (!submission) {
        throw new Error("The linked intake submission no longer exists.");
      }

      const emailInput = {
        referenceId: submission.id,
        parentFullName: submission.parent_full_name,
        parentEmail: submission.parent_email,
        parentPhone: submission.parent_phone,
        studentFirstName: submission.student_first_name,
        grade: submission.grade,
        subjectLabel: getIntakeSubjectLabel(submission.subject),
        courseName: submission.course_name ?? "Not specified",
        schoolName: submission.school_name,
        formatLabel: getIntakeFormatLabel(submission.session_format),
        currentChallenge: submission.goals,
        upcomingDeadline: submission.upcoming_deadline ?? "Not specified",
        preferredAvailability: submission.preferred_availability ?? "Not specified",
        requestedLocation: submission.requested_location,
        referralSource: submission.referral_source,
      };

      const emailResult =
        log.template === "intake-confirmation"
          ? await sendAcademyIntakeConfirmationEmail(emailInput)
          : await sendAcademyIntakeNotificationEmail(emailInput);

      if (!emailResult.sent) {
        throw new Error("Academy email env is incomplete, so the intake email was not sent.");
      }

      await insertAcademyAuditEvent({
        actor,
        action: `intake.email_resent.${log.template}`,
        targetType: "academy_intake_submission",
        targetId: submission.id,
        targetEmail: log.recipient,
        details: { emailLogId: log.id },
      });
      return;
    }
    default:
      throw new Error("This email template does not support resend from the admin UI yet.");
  }
}

export async function inviteAcademyPortalAccountAction(formData: FormData) {
  const user = await requireAcademyAdminUser();
  const accountId = requireFormValue(formData, "account_id");
  const account = await getAcademyPortalAccountById(accountId);

  if (!account) {
    throw new Error("The selected portal account was not found.");
  }

  await deliverPortalInviteEmail({
    account,
    actor: user,
  });

  revalidateAdminPaths([
    "/admin",
    "/admin/parents",
    "/admin/tutors",
    "/admin/students",
    "/admin/access",
    "/admin/emails",
  ]);
}

export async function createAcademyAdminPortalAccountAction(formData: FormData) {
  const user = await requireAcademyAdminUser();
  const email = sanitizeEmailAddress(requireFormValue(formData, "email"));
  const accountId = await upsertPortalAccount({
    role: "admin",
    email,
    entityId: null,
    status: "active",
  });

  await insertAcademyAuditEvent({
    actor: user,
    action: "portal_account.created_admin",
    targetType: "academy_portal_account",
    targetId: accountId,
    targetEmail: email,
    details: { role: "admin" },
  });

  revalidateAdminPaths(["/admin/access", "/admin"]);
}

export async function sendAcademyPortalPasswordResetAction(formData: FormData) {
  const user = await requireAcademyAdminUser();
  const accountId = requireFormValue(formData, "account_id");
  const account = await getAcademyPortalAccountById(accountId);

  if (!account) {
    throw new Error("The selected portal account was not found.");
  }

  await deliverPortalPasswordResetEmail({
    account,
    actor: user,
  });

  revalidateAdminPaths(["/admin/access", "/admin/parents", "/admin/tutors", "/admin/students", "/admin/emails"]);
}

export async function revokeAcademyPortalAccountSessionsAction(formData: FormData) {
  const user = await requireAcademyAdminUser();
  const accountId = requireFormValue(formData, "account_id");
  const account = await getAcademyPortalAccountById(accountId);

  if (!account) {
    throw new Error("The selected portal account was not found.");
  }

  const forcedReauthenticationAt = new Date().toISOString();
  const supabase = getSupabaseServiceClient() as any;
  const { error } = await supabase
    .from("academy_portal_accounts")
    .update({
      force_reauth_after: forcedReauthenticationAt,
    })
    .eq("id", accountId);

  if (error) {
    throw error;
  }

  await insertAcademyAuditEvent({
    actor: user,
    action: "portal_account.sessions_revoked",
    targetType: "academy_portal_account",
    targetId: accountId,
    targetEmail: account.email,
    details: {
      role: account.role,
      forcedReauthenticationAt,
    },
  });

  revalidateAdminPaths([
    "/admin",
    "/admin/access",
    "/admin/parents",
    "/admin/tutors",
    "/admin/students",
  ]);
}

export async function resendAcademyEmailLogAction(formData: FormData) {
  const user = await requireAcademyAdminUser();
  const logId = requireFormValue(formData, "log_id");

  await resendLoggedEmail(logId, user);

  revalidateAdminPaths([
    "/admin",
    "/admin/access",
    "/admin/emails",
    "/admin/intake",
    "/admin/session-notes",
    "/admin/sessions",
  ]);
}

export async function sendAcademySessionScheduledEmailAction(formData: FormData) {
  const user = await requireAcademyAdminUser();
  const sessionId = requireFormValue(formData, "session_id");
  const payload = await deliverScheduledSessionEmail(sessionId);

  await insertAcademyAuditEvent({
    actor: user,
    action: "session.scheduled_email_sent",
    targetType: "academy_session",
    targetId: sessionId,
    targetEmail: payload.parent.email,
    details: { sessionId },
  });

  revalidateAdminPaths(["/admin/emails", "/admin/sessions", `/admin/sessions/${sessionId}`]);
}

export async function disableAcademyPortalAccountAction(formData: FormData) {
  const user = await requireAcademyAdminUser();
  const accountId = requireFormValue(formData, "account_id");
  const account = await getAcademyPortalAccountById(accountId);

  if (!account) {
    throw new Error("The selected portal account was not found.");
  }

  const supabase = getSupabaseServiceClient() as any;
  await supabase
    .from("academy_portal_accounts")
    .update({
      status: "disabled",
      disabled_at: new Date().toISOString(),
    })
    .eq("id", account.id);

  if (account.auth_user_id) {
    await supabase.auth.admin.updateUserById(account.auth_user_id, {
      ban_duration: "876000h",
    });
  }

  await insertAcademyAuditEvent({
    actor: user,
    action: "portal_account.disabled",
    targetType: "academy_portal_account",
    targetId: account.id,
    targetEmail: account.email,
    details: { role: account.role },
  });

  revalidateAdminPaths(["/admin/access", "/admin/parents", "/admin/tutors", "/admin/students"]);
}

export async function enableAcademyPortalAccountAction(formData: FormData) {
  const user = await requireAcademyAdminUser();
  const accountId = requireFormValue(formData, "account_id");
  const account = await getAcademyPortalAccountById(accountId);

  if (!account) {
    throw new Error("The selected portal account was not found.");
  }

  const supabase = getSupabaseServiceClient() as any;
  await supabase
    .from("academy_portal_accounts")
    .update({
      status: "active",
      disabled_at: null,
    })
    .eq("id", account.id);

  if (account.auth_user_id) {
    await supabase.auth.admin.updateUserById(account.auth_user_id, {
      ban_duration: "none",
    });
  }

  await insertAcademyAuditEvent({
    actor: user,
    action: "portal_account.enabled",
    targetType: "academy_portal_account",
    targetId: account.id,
    targetEmail: account.email,
    details: { role: account.role },
  });

  revalidateAdminPaths(["/admin/access", "/admin/parents", "/admin/tutors", "/admin/students"]);
}


async function upsertPortalAccount(input: {
  role: AcademyPortalAccountRole;
  email: string;
  entityId: string | null;
  status?: "active" | "invited" | "disabled";
}) {
  const supabase = getSupabaseServiceClient() as any;
  const normalizedEmail = sanitizeEmailAddress(input.email);
  const entityPayload = getPortalAccountEntity(input.role, input.entityId);

  if (input.entityId && input.role !== "admin") {
    const existingAccount = await getAcademyPortalAccountByEntity({
      role: input.role,
      entityId: input.entityId,
    });

    if (existingAccount) {
      const { error } = await supabase
        .from("academy_portal_accounts")
        .update({
          email: normalizedEmail,
          status: input.status ?? existingAccount.status,
          disabled_at: input.status === "disabled" ? new Date().toISOString() : null,
          ...entityPayload,
        })
        .eq("id", existingAccount.id);

      if (error) {
        throw error;
      }

      return existingAccount.id;
    }
  }

  const { data, error } = await supabase
    .from("academy_portal_accounts")
    .upsert(
      {
        email: normalizedEmail,
        role: input.role,
        status: input.status ?? "active",
        disabled_at: input.status === "disabled" ? new Date().toISOString() : null,
        ...entityPayload,
      },
      {
        onConflict: "email,role",
      },
    )
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return String(data.id);
}

async function findDuplicateStudent(input: {
  firstName: string;
  lastName: string | null;
  grade: string;
  schoolName: string | null;
  parentId: string | null;
  excludeStudentId?: string;
}) {
  const supabase = getSupabaseServiceClient() as any;
  // Narrow the candidate set in SQL first, then apply the exact family/self-managed rules in code.
  let query = supabase
    .from("academy_students")
    .select("id, parent_id, first_name, last_name, grade, school_name")
    .ilike("first_name", input.firstName)
    .ilike("grade", input.grade);

  if (input.parentId) {
    query = query.eq("parent_id", input.parentId);
  } else {
    query = query.is("parent_id", null);
  }

  const { data, error } = await query.limit(20);

  if (error) {
    throw error;
  }

  const normalizedLastName = (input.lastName ?? "").trim().toLowerCase();
  const normalizedSchoolName = (input.schoolName ?? "").trim().toLowerCase();

  return (data ?? []).find((student: {
    id: string;
    last_name: string | null;
    school_name: string | null;
  }) => {
    if (input.excludeStudentId && student.id === input.excludeStudentId) {
      return false;
    }

    const sameLastName = (student.last_name ?? "").trim().toLowerCase() === normalizedLastName;

    if (!sameLastName) {
      return false;
    }

    if (input.parentId) {
      return true;
    }

    return (student.school_name ?? "").trim().toLowerCase() === normalizedSchoolName;
  }) ?? null;
}

async function ensureStudentSubjectIsUnique(input: {
  studentId: string;
  subject: string;
  courseName: string | null;
}) {
  const supabase = getSupabaseServiceClient() as any;
  // Subject uniqueness is enforced per student and normalized course name combination.
  const { data, error } = await supabase
    .from("academy_student_subjects")
    .select("id, course_name")
    .eq("student_id", input.studentId)
    .ilike("subject", input.subject)
    .limit(20);

  if (error) {
    throw error;
  }

  const normalizedCourseName = (input.courseName ?? "").trim().toLowerCase();
  const duplicateSubject = (data ?? []).find((subject: { course_name: string | null }) => {
    return (subject.course_name ?? "").trim().toLowerCase() === normalizedCourseName;
  });

  if (duplicateSubject) {
    throw new Error("A matching student subject record already exists for this student.");
  }
}

async function assertSessionRelationships(input: {
  studentId: string;
  parentId: string;
  studentSubjectId: string | null;
}) {
  const student = await getAcademyStudentById(input.studentId);

  if (!student) {
    throw new Error("The selected student was not found.");
  }

  if (!student.parent_id) {
    throw new Error("The selected student must be linked to a parent before a session can be saved.");
  }

  if (student.parent_id !== input.parentId) {
    throw new Error("The selected parent does not match the selected student.");
  }

  if (input.studentSubjectId) {
    const studentSubject = await getAcademyStudentSubjectById(input.studentSubjectId);

    if (!studentSubject) {
      throw new Error("The selected student subject record was not found.");
    }

    if (studentSubject.student_id !== input.studentId) {
      throw new Error("The selected student subject record does not belong to the selected student.");
    }
  }
}

async function assertPaymentRelationships(input: {
  parentId: string;
  studentId: string;
  sessionId: string | null;
}) {
  if (!input.sessionId) {
    return;
  }

  const session = await getAcademySessionById(input.sessionId);

  if (!session) {
    throw new Error("The selected session was not found.");
  }

  if (session.parent_id !== input.parentId || session.student_id !== input.studentId) {
    throw new Error("The selected payment session does not match the selected parent and student.");
  }
}

export async function convertAcademyIntakeToRecordsAction(formData: FormData) {
  const submissionId = requireFormValue(formData, "submission_id");
  const lastName = sanitizePlainText(String(formData.get("student_last_name") ?? ""), {
    maxLength: 80,
  });
  const subjectLevel = sanitizePlainText(String(formData.get("subject_level") ?? ""), {
    maxLength: 80,
  });

  const user = await requireAcademyAdminUser();
  const supabase = getSupabaseServiceClient() as any;
  const { data: submissionData, error: submissionError } = await supabase
    .from("academy_intake_submissions")
    .select("*")
    .eq("id", submissionId)
    .maybeSingle();

  if (submissionError) {
    throw submissionError;
  }

  const submission = submissionData as {
    id: string;
    parent_full_name: string;
    parent_email: string;
    parent_phone: string | null;
    student_first_name: string;
    grade: string;
    school_name: string | null;
    subject: string;
    course_name: string | null;
    status: AcademyIntakeStatus;
  } | null;

  if (!submission) {
    throw new Error("The selected intake submission was not found.");
  }

  const existingParent = await getAcademyParentByEmail(submission.parent_email);
  let parentId = existingParent?.id ?? null;

  if (!existingParent) {
    const { data: parentRow, error: parentInsertError } = await supabase
      .from("academy_parents")
      .insert({
        full_name: submission.parent_full_name,
        email: sanitizeEmailAddress(submission.parent_email),
        phone: submission.parent_phone,
        created_from_intake_id: submission.id,
      })
      .select("id")
      .single();

    if (parentInsertError) {
      throw parentInsertError;
    }

    parentId = String(parentRow.id);
  } else {
    await supabase
      .from("academy_parents")
      .update({
        full_name: submission.parent_full_name,
        phone: submission.parent_phone,
      })
      .eq("id", existingParent.id);
  }

  if (parentId) {
    const accountId = await upsertPortalAccount({
      role: "parent",
      email: submission.parent_email,
      entityId: parentId,
      status: "active",
    });

    await insertAcademyAuditEvent({
      actor: user,
      action: "portal_account.synced_intake_parent",
      targetType: "academy_portal_account",
      targetId: accountId,
      targetEmail: submission.parent_email,
      details: { intakeSubmissionId: submission.id, parentId },
    });
  }

  const duplicateStudent = await findDuplicateStudent({
    firstName: submission.student_first_name,
    lastName: lastName || null,
    grade: submission.grade,
    schoolName: submission.school_name,
    parentId,
  });

  if (duplicateStudent) {
    throw new Error("A matching student record already exists for this intake.");
  }

  const { data: studentRow, error: studentInsertError } = await supabase
    .from("academy_students")
    .insert({
      parent_id: parentId,
      first_name: submission.student_first_name,
      last_name: lastName || null,
      grade: submission.grade,
      school_name: submission.school_name,
      created_from_intake_id: submission.id,
    })
    .select("id")
    .single();

  if (studentInsertError) {
    throw studentInsertError;
  }

  const studentId = String(studentRow.id);

  await ensureStudentSubjectIsUnique({
    studentId,
    subject: submission.subject,
    courseName: submission.course_name,
  });

  const { data: studentSubjectRow, error: studentSubjectInsertError } = await supabase
    .from("academy_student_subjects")
    .insert({
      student_id: studentId,
      subject: submission.subject,
      course_name: submission.course_name,
      level: subjectLevel || null,
    })
    .select("id")
    .single();

  if (studentSubjectInsertError) {
    throw studentSubjectInsertError;
  }

  const studentSubjectId = String(studentSubjectRow.id);
  const { error: updateSubmissionError } = await supabase
    .from("academy_intake_submissions")
    .update({
      status: "converted",
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
      converted_parent_id: parentId,
      converted_student_id: studentId,
      converted_student_subject_id: studentSubjectId,
    })
    .eq("id", submission.id);

  if (updateSubmissionError) {
    throw updateSubmissionError;
  }

  await supabase.from("academy_intake_status_events").insert({
    intake_submission_id: submission.id,
    previous_status: submission.status,
    next_status: "converted",
    changed_by: user.id,
    changed_by_email: user.email ?? null,
    note: "Converted intake to parent, student, and student subject records.",
  });

  await insertAcademyAuditEvent({
    actor: user,
    action: "intake.converted",
    targetType: "academy_intake_submission",
    targetId: submission.id,
    targetEmail: submission.parent_email,
    details: {
      parentId,
      studentId,
      studentSubjectId,
    },
  });

  revalidateAdminPaths([
    "/admin",
    "/admin/intake",
    `/admin/intake/${submission.id}`,
    "/admin/parents",
    "/admin/students",
  ]);
}

export async function upsertAcademyTutorAction(formData: FormData) {
  const user = await requireAcademyAdminUser();

  const tutorId = String(formData.get("tutor_id") ?? "").trim();
  const subjects = String(formData.get("subjects") ?? "")
    .split(",")
    .map((subject) => sanitizePlainText(subject, { maxLength: 80 }))
    .filter(Boolean);
  const levels = String(formData.get("levels") ?? "")
    .split(",")
    .map((level) => sanitizePlainText(level, { maxLength: 80 }))
    .filter(Boolean);
  const hourlyRateRaw = String(formData.get("hourly_rate_cents") ?? "").trim();
  const hourlyRateCents = hourlyRateRaw ? Number.parseInt(hourlyRateRaw, 10) : null;
  const supabase = getSupabaseServiceClient() as any;
  const payload = {
    full_name: requireFormValue(formData, "full_name"),
    email: sanitizeEmailAddress(requireFormValue(formData, "email")),
    phone: optionalFormValue(formData, "phone", 30),
    subjects,
    levels,
    hourly_rate_cents: Number.isFinite(hourlyRateCents) ? hourlyRateCents : null,
    status: sanitizePlainText(String(formData.get("status") ?? "active"), { maxLength: 40 }),
    internal_notes: optionalFormValue(formData, "internal_notes", 2000),
  };

  let savedTutorId = tutorId;

  if (tutorId) {
    const { error } = await supabase.from("academy_tutors").update(payload).eq("id", tutorId);

    if (error) {
      throw error;
    }
  } else {
    const { data, error } = await supabase.from("academy_tutors").insert(payload).select("id").single();

    if (error) {
      throw error;
    }

    savedTutorId = String(data.id);
  }

  const accountId = await upsertPortalAccount({
    role: "tutor",
    email: payload.email,
    entityId: savedTutorId,
    status: payload.status === "active" ? "active" : "disabled",
  });

  await insertAcademyAuditEvent({
    actor: user,
    action: tutorId ? "tutor.updated" : "tutor.created",
    targetType: "academy_tutor",
    targetId: savedTutorId,
    targetEmail: payload.email,
    details: { portalAccountId: accountId, status: payload.status },
  });

  revalidateAdminPaths(["/admin", "/admin/tutors", `/admin/tutors/${savedTutorId}`]);
}

export async function assignTutorToStudentSubjectAction(formData: FormData) {
  const user = await requireAcademyAdminUser();

  const studentSubjectId = requireFormValue(formData, "student_subject_id");
  const tutorId = String(formData.get("tutor_id") ?? "").trim() || null;
  const supabase = getSupabaseServiceClient() as any;
  const { error } = await supabase
    .from("academy_student_subjects")
    .update({ tutor_id: tutorId })
    .eq("id", studentSubjectId);

  if (error) {
    throw error;
  }

  await insertAcademyAuditEvent({
    actor: user,
    action: "student_subject.tutor_assigned",
    targetType: "academy_student_subject",
    targetId: studentSubjectId,
    details: { tutorId },
  });

  revalidateAdminPaths(["/admin/students", "/admin/tutors"]);
}

export async function updateAcademyParentAction(formData: FormData) {
  const user = await requireAcademyAdminUser();

  const parentId = requireFormValue(formData, "parent_id");
  const supabase = getSupabaseServiceClient() as any;
  const email = sanitizeEmailAddress(requireFormValue(formData, "email"));
  const { error } = await supabase
    .from("academy_parents")
    .update({
      full_name: requireFormValue(formData, "full_name"),
      email,
      phone: optionalFormValue(formData, "phone", 30),
      stripe_customer_id: optionalFormValue(formData, "stripe_customer_id", 120),
    })
    .eq("id", parentId);

  if (error) {
    throw error;
  }

  const accountId = await upsertPortalAccount({
    role: "parent",
    email,
    entityId: parentId,
    status: "active",
  });

  await insertAcademyAuditEvent({
    actor: user,
    action: "parent.updated",
    targetType: "academy_parent",
    targetId: parentId,
    targetEmail: email,
    details: { portalAccountId: accountId },
  });

  revalidateAdminPaths(["/admin/parents", `/admin/parents/${parentId}`]);
}

export async function createAcademyParentAction(formData: FormData) {
  const user = await requireAcademyAdminUser();

  const supabase = getSupabaseServiceClient() as any;
  const email = sanitizeEmailAddress(requireFormValue(formData, "email"));
  const { data, error } = await supabase.from("academy_parents").insert({
    full_name: requireFormValue(formData, "full_name"),
    email,
    phone: optionalFormValue(formData, "phone", 30),
    stripe_customer_id: optionalFormValue(formData, "stripe_customer_id", 120),
  }).select("id").single();

  if (error) {
    throw error;
  }

  const parentId = String(data.id);
  const accountId = await upsertPortalAccount({
    role: "parent",
    email,
    entityId: parentId,
    status: "active",
  });

  await insertAcademyAuditEvent({
    actor: user,
    action: "parent.created",
    targetType: "academy_parent",
    targetId: parentId,
    targetEmail: email,
    details: { portalAccountId: accountId },
  });

  revalidateAdminPaths(["/admin/parents", "/admin/students"]);
}

export async function updateAcademyStudentAction(formData: FormData) {
  const user = await requireAcademyAdminUser();

  const studentId = requireFormValue(formData, "student_id");
  const parentId = String(formData.get("parent_id") ?? "").trim() || null;
  const firstName = requireFormValue(formData, "first_name");
  const lastName = optionalFormValue(formData, "last_name", 80);
  const grade = requireFormValue(formData, "grade");
  const schoolName = optionalFormValue(formData, "school_name", 120);
  const duplicateStudent = await findDuplicateStudent({
    firstName,
    lastName,
    grade,
    schoolName,
    parentId,
    excludeStudentId: studentId,
  });

  if (duplicateStudent) {
    throw new Error("A matching student record already exists for this family or student profile.");
  }

  const supabase = getSupabaseServiceClient() as any;
  const { error } = await supabase
    .from("academy_students")
    .update({
      parent_id: parentId,
      first_name: firstName,
      last_name: lastName,
      grade,
      school_name: schoolName,
      status: sanitizePlainText(String(formData.get("status") ?? "active"), { maxLength: 40 }),
    })
    .eq("id", studentId);

  if (error) {
    throw error;
  }

  await insertAcademyAuditEvent({
    actor: user,
    action: "student.updated",
    targetType: "academy_student",
    targetId: studentId,
    details: { parentId },
  });

  revalidateAdminPaths(["/admin/students", `/admin/students/${studentId}`]);
}

export async function createAcademyStudentAction(formData: FormData) {
  const user = await requireAcademyAdminUser();

  const supabase = getSupabaseServiceClient() as any;
  const parentMode = sanitizePlainText(String(formData.get("parent_mode") ?? "existing"), {
    maxLength: 40,
  });
  const selectedParentId = String(formData.get("parent_id") ?? "").trim();
  const studentPortalEmail = sanitizeEmailAddress(String(formData.get("student_portal_email") ?? ""));
  const initialSubject = sanitizePlainText(String(formData.get("initial_subject") ?? ""), {
    maxLength: 80,
  });
  const initialCourseName = sanitizePlainText(String(formData.get("initial_course_name") ?? ""), {
    maxLength: 120,
  });
  const initialLevel = sanitizePlainText(String(formData.get("initial_level") ?? ""), {
    maxLength: 80,
  });

  let parentId: string | null = null;
  const firstName = requireFormValue(formData, "first_name");
  const lastName = optionalFormValue(formData, "last_name", 80);
  const grade = requireFormValue(formData, "grade");
  const schoolName = optionalFormValue(formData, "school_name", 120);

  if (parentMode === "existing" && selectedParentId) {
    parentId = selectedParentId;
    const linkedParent = await getAcademyParentById(selectedParentId);

    if (linkedParent) {
      await upsertPortalAccount({
        role: "parent",
        email: linkedParent.email,
        entityId: linkedParent.id,
        status: "active",
      });
    }
  }

  if (parentMode === "self_managed") {
    const contactName = requireFormValue(formData, "contact_full_name");
    const contactEmail = sanitizeEmailAddress(requireFormValue(formData, "contact_email"));
    const contactPhone = optionalFormValue(formData, "contact_phone", 30);
    const existingParent = await getAcademyParentByEmail(contactEmail);

    if (existingParent) {
      parentId = existingParent.id;
      await supabase
        .from("academy_parents")
        .update({
          full_name: contactName,
          phone: contactPhone,
        })
        .eq("id", existingParent.id);
    } else {
      const { data: parentRow, error: parentInsertError } = await supabase
        .from("academy_parents")
        .insert({
          full_name: contactName,
          email: contactEmail,
          phone: contactPhone,
        })
        .select("id")
        .single();

      if (parentInsertError) {
        throw parentInsertError;
      }

      parentId = String(parentRow.id);
    }

    if (parentId) {
      const accountId = await upsertPortalAccount({
        role: "parent",
        email: contactEmail,
        entityId: parentId,
        status: "active",
      });

      await insertAcademyAuditEvent({
        actor: user,
        action: "portal_account.synced_self_managed_contact",
        targetType: "academy_portal_account",
        targetId: accountId,
        targetEmail: contactEmail,
        details: { parentId },
      });
    }
  }

  const duplicateStudent = await findDuplicateStudent({
    firstName,
    lastName,
    grade,
    schoolName,
    parentId,
  });

  if (duplicateStudent) {
    throw new Error("A matching student record already exists for this family or student profile.");
  }

  const { data: studentRow, error: studentInsertError } = await supabase
    .from("academy_students")
    .insert({
      parent_id: parentId,
      first_name: firstName,
      last_name: lastName,
      grade,
      school_name: schoolName,
      status: sanitizePlainText(String(formData.get("status") ?? "active"), { maxLength: 40 }),
    })
    .select("id")
    .single();

  if (studentInsertError) {
    throw studentInsertError;
  }

  const studentId = String(studentRow.id);

  await insertAcademyAuditEvent({
    actor: user,
    action: "student.created",
    targetType: "academy_student",
    targetId: studentId,
    details: { parentId, parentMode },
  });

  if (initialSubject) {
    await ensureStudentSubjectIsUnique({
      studentId,
      subject: initialSubject,
      courseName: initialCourseName || null,
    });

    const { data: subjectRow, error: subjectInsertError } = await supabase
      .from("academy_student_subjects")
      .insert({
        student_id: studentId,
        subject: initialSubject,
        course_name: initialCourseName || null,
        level: initialLevel || null,
      })
      .select("id")
      .single();

    if (subjectInsertError) {
      throw subjectInsertError;
    }

    await insertAcademyAuditEvent({
      actor: user,
      action: "student_subject.created",
      targetType: "academy_student_subject",
      targetId: String(subjectRow.id),
      details: { subject: initialSubject, courseName: initialCourseName || null },
    });
  }

  if (studentPortalEmail) {
    const accountId = await upsertPortalAccount({
      role: "student",
      email: studentPortalEmail,
      status: "active",
      entityId: studentId,
    });

    await insertAcademyAuditEvent({
      actor: user,
      action: "portal_account.created_for_student",
      targetType: "academy_portal_account",
      targetId: accountId,
      targetEmail: studentPortalEmail,
      details: { studentId },
    });
  }

  revalidateAdminPaths(["/admin/students", "/admin/parents", `/admin/students/${studentId}`]);
}

export async function upsertAcademyStudentPortalAccountAction(formData: FormData) {
  const user = await requireAcademyAdminUser();

  const studentId = requireFormValue(formData, "student_id");
  const email = sanitizeEmailAddress(requireFormValue(formData, "email"));
  const status = sanitizePlainText(String(formData.get("status") ?? "active"), { maxLength: 40 });

  if (!["active", "invited", "disabled"].includes(status)) {
    throw new Error("Invalid portal access status.");
  }

  const accountId = await upsertPortalAccount({
    role: "student",
    email,
    status: status as "active" | "invited" | "disabled",
    entityId: studentId,
  });

  await insertAcademyAuditEvent({
    actor: user,
    action: "student.portal_access_updated",
    targetType: "academy_student",
    targetId: studentId,
    targetEmail: email,
    details: { portalAccountId: accountId, status },
  });

  revalidateAdminPaths(["/admin/students", `/admin/students/${studentId}`, "/student"]);
}

export async function createAcademySessionAction(formData: FormData) {
  const user = await requireAcademyAdminUser();

  const supabase = getSupabaseServiceClient() as any;
  const studentId = requireFormValue(formData, "student_id");
  const parentId = requireFormValue(formData, "parent_id");
  const tutorId = String(formData.get("tutor_id") ?? "").trim() || null;
  const studentSubjectId = String(formData.get("student_subject_id") ?? "").trim() || null;
  const status = sanitizePlainText(String(formData.get("status") ?? "scheduled"), {
    maxLength: 40,
  });
  const paymentStatus = normalizeOptionalPaymentStatus(String(formData.get("payment_status") ?? "pending"));
  const { startsAtIso, endsAtIso } = getNormalizedDateRange(formData);

  if (!isAcademySessionStatus(status)) {
    throw new Error("Invalid session status.");
  }

  await assertSessionRelationships({
    studentId,
    parentId,
    studentSubjectId,
  });

  const insertPayload = {
    student_id: studentId,
    parent_id: parentId,
    tutor_id: tutorId,
    student_subject_id: studentSubjectId,
    subject: requireFormValue(formData, "subject"),
    course_name: optionalFormValue(formData, "course_name", 120),
    starts_at: startsAtIso,
    ends_at: endsAtIso,
    format: sanitizePlainText(String(formData.get("format") ?? "online"), { maxLength: 40 }),
    location: optionalFormValue(formData, "location", 160),
    meeting_url: optionalFormValue(formData, "meeting_url", 500),
    // Google Calendar event IDs are now managed by the scheduling sync helper, not by manual form entry.
    google_calendar_event_id: null,
    status,
    payment_status: paymentStatus,
  };

  const { data: sessionRow, error } = await supabase
    .from("academy_sessions")
    .insert(insertPayload)
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  const sessionId = String(sessionRow.id);
  await synchronizeAcademySessionCalendarEvent({
    sessionId,
    actor: user,
  });

  try {
    await deliverScheduledSessionEmail(sessionId);
  } catch (emailError) {
    console.error("Academy scheduled session email delivery failed", emailError);
  }

  await insertAcademyAuditEvent({
    actor: user,
    action: "session.created",
    targetType: "academy_session",
    targetId: sessionId,
    details: {
      studentId,
      parentId,
      tutorId,
      studentSubjectId,
      status,
      paymentStatus,
    },
  });

  revalidateAdminPaths([
    "/admin",
    "/admin/sessions",
    `/admin/sessions/${sessionId}`,
    "/parent",
    "/parent/sessions",
    "/student",
    "/student/sessions",
    "/tutor",
    "/tutor/sessions",
  ]);
}

export async function updateAcademySessionAction(formData: FormData) {
  const user = await requireAcademyAdminUser();

  const sessionId = requireFormValue(formData, "session_id");
  const status = sanitizePlainText(String(formData.get("status") ?? "scheduled"), {
    maxLength: 40,
  });
  const paymentStatus = normalizeOptionalPaymentStatus(String(formData.get("payment_status") ?? "pending"));
  const { startsAtIso, endsAtIso } = getNormalizedDateRange(formData);

  if (!isAcademySessionStatus(status)) {
    throw new Error("Invalid session status.");
  }

  const currentSession = await getAcademySessionById(sessionId);

  if (!currentSession?.student_id || !currentSession.parent_id) {
    throw new Error("The selected session is missing linked parent or student data.");
  }

  await assertSessionRelationships({
    studentId: currentSession.student_id,
    parentId: currentSession.parent_id,
    studentSubjectId: currentSession.student_subject_id,
  });

  const supabase = getSupabaseServiceClient() as any;
  const { error } = await supabase
    .from("academy_sessions")
    .update({
      subject: requireFormValue(formData, "subject"),
      course_name: optionalFormValue(formData, "course_name", 120),
      starts_at: startsAtIso,
      ends_at: endsAtIso,
      format: sanitizePlainText(String(formData.get("format") ?? "online"), { maxLength: 40 }),
      location: optionalFormValue(formData, "location", 160),
      meeting_url: optionalFormValue(formData, "meeting_url", 500),
      // Preserve the external event ID so ordinary session edits do not orphan the linked calendar event.
      google_calendar_event_id: currentSession.google_calendar_event_id,
      status,
      payment_status: paymentStatus,
    })
    .eq("id", sessionId);

  if (error) {
    throw error;
  }

  await synchronizeAcademySessionCalendarEvent({
    sessionId,
    actor: user,
  });

  await insertAcademyAuditEvent({
    actor: user,
    action: "session.updated",
    targetType: "academy_session",
    targetId: sessionId,
    details: { status, paymentStatus },
  });

  revalidateAdminPaths([
    "/admin/sessions",
    `/admin/sessions/${sessionId}`,
    "/parent",
    "/parent/sessions",
    `/parent/sessions/${sessionId}`,
    "/student",
    "/student/sessions",
    `/student/sessions/${sessionId}`,
    "/tutor",
    "/tutor/sessions",
    `/tutor/sessions/${sessionId}`,
  ]);
}

export async function syncAcademySessionCalendarEventAction(formData: FormData) {
  const user = await requireAcademyAdminUser();
  const sessionId = requireFormValue(formData, "session_id");

  await synchronizeAcademySessionCalendarEvent({
    sessionId,
    actor: user,
    throwOnFailure: true,
  });

  revalidateAdminPaths([
    "/admin/sessions",
    `/admin/sessions/${sessionId}`,
    "/parent",
    "/parent/sessions",
    `/parent/sessions/${sessionId}`,
    "/student",
    "/student/sessions",
    `/student/sessions/${sessionId}`,
    "/tutor",
    "/tutor/sessions",
    `/tutor/sessions/${sessionId}`,
  ]);
}

export async function createAcademyPaymentAction(formData: FormData) {
  const user = await requireAcademyAdminUser();

  const status = sanitizePlainText(String(formData.get("status") ?? "pending"), {
    maxLength: 40,
  });

  if (!isAcademyPaymentStatus(status)) {
    throw new Error("Invalid payment status.");
  }

  const parentId = requireFormValue(formData, "parent_id");
  const studentId = requireFormValue(formData, "student_id");
  const sessionId = String(formData.get("session_id") ?? "").trim() || null;

  await assertPaymentRelationships({
    parentId,
    studentId,
    sessionId,
  });

  const supabase = getSupabaseServiceClient() as any;
  const { data, error } = await supabase.from("academy_payments").insert({
    parent_id: parentId,
    student_id: studentId,
    session_id: sessionId,
    stripe_customer_id: optionalFormValue(formData, "stripe_customer_id", 160),
    stripe_checkout_session_id: optionalFormValue(formData, "stripe_checkout_session_id", 160),
    stripe_invoice_id: optionalFormValue(formData, "stripe_invoice_id", 160),
    stripe_payment_intent_id: optionalFormValue(formData, "stripe_payment_intent_id", 160),
    amount_cents: requireNonNegativeInteger(requireFormValue(formData, "amount_cents"), "Amount"),
    currency: sanitizePlainText(String(formData.get("currency") ?? "usd"), { maxLength: 10 }),
    status,
    description: optionalFormValue(formData, "description", 300),
  }).select("id").single();

  if (error) {
    throw error;
  }

  await insertAcademyAuditEvent({
    actor: user,
    action: "payment.created",
    targetType: "academy_payment",
    targetId: String(data.id),
    details: { parentId, studentId, sessionId, status },
  });

  revalidateAdminPaths(["/admin/payments"]);
}

export async function updateAcademyPaymentAction(formData: FormData) {
  const user = await requireAcademyAdminUser();

  const paymentId = requireFormValue(formData, "payment_id");
  const status = sanitizePlainText(String(formData.get("status") ?? "pending"), {
    maxLength: 40,
  });

  if (!isAcademyPaymentStatus(status)) {
    throw new Error("Invalid payment status.");
  }

  const payment = await getAcademyPaymentById(paymentId);

  if (!payment?.parent_id || !payment.student_id) {
    throw new Error("The selected payment is missing linked parent or student data.");
  }

  await assertPaymentRelationships({
    parentId: payment.parent_id,
    studentId: payment.student_id,
    sessionId: payment.session_id,
  });

  const supabase = getSupabaseServiceClient() as any;
  const { error } = await supabase
    .from("academy_payments")
    .update({
      status,
      description: optionalFormValue(formData, "description", 300),
      stripe_customer_id: optionalFormValue(formData, "stripe_customer_id", 160),
      stripe_checkout_session_id: optionalFormValue(formData, "stripe_checkout_session_id", 160),
      stripe_invoice_id: optionalFormValue(formData, "stripe_invoice_id", 160),
      stripe_payment_intent_id: optionalFormValue(formData, "stripe_payment_intent_id", 160),
    })
    .eq("id", paymentId);

  if (error) {
    throw error;
  }

  await insertAcademyAuditEvent({
    actor: user,
    action: "payment.updated",
    targetType: "academy_payment",
    targetId: paymentId,
    details: { status },
  });

  revalidateAdminPaths(["/admin/payments", `/admin/payments/${paymentId}`]);
}

export async function attachAcademyRecordingAction(formData: FormData) {
  const user = await requireAcademyAdminUser();

  const sessionId = requireFormValue(formData, "session_id");
  const existingRecording = await getAcademyRecordingBySessionId(sessionId);
  const supabase = getSupabaseServiceClient() as any;
  const expiresAtIso = new Date(requireFormValue(formData, "expires_at"));

  if (Number.isNaN(expiresAtIso.getTime())) {
    throw new Error("Recording expiry must be a valid date.");
  }

  const payload = {
    session_id: sessionId,
    recording_url: requireHttpsOrHttpUrl(requireFormValue(formData, "recording_url"), "Recording URL"),
    storage_provider: sanitizePlainText(String(formData.get("storage_provider") ?? "manual"), {
      maxLength: 40,
    }),
    visible_to_parent: String(formData.get("visible_to_parent") ?? "") === "on",
    expires_at: expiresAtIso.toISOString(),
  };

  if (existingRecording) {
    const { error } = await supabase
      .from("academy_recordings")
      .update(payload)
      .eq("id", existingRecording.id);

    if (error) {
      throw error;
    }

    await insertAcademyAuditEvent({
      actor: user,
      action: "recording.updated",
      targetType: "academy_recording",
      targetId: existingRecording.id,
      details: { sessionId, visibleToParent: payload.visible_to_parent },
    });
  } else {
    const { data, error } = await supabase.from("academy_recordings").insert(payload).select("id").single();

    if (error) {
      throw error;
    }

    await insertAcademyAuditEvent({
      actor: user,
      action: "recording.created",
      targetType: "academy_recording",
      targetId: String(data.id),
      details: { sessionId, visibleToParent: payload.visible_to_parent },
    });
  }

  revalidateAdminPaths([
    "/admin/sessions",
    `/admin/sessions/${sessionId}`,
    `/admin/sessions/${sessionId}/recording`,
    "/parent",
    "/parent/sessions",
    `/parent/sessions/${sessionId}`,
    `/parent/sessions/${sessionId}/recording`,
  ]);
}

export async function manageAcademyRecordingAvailabilityAction(formData: FormData) {
  const user = await requireAcademyAdminUser();

  const sessionId = requireFormValue(formData, "session_id");
  const availabilityAction = requireFormValue(formData, "availability_action");
  const recording = await getAcademyRecordingBySessionId(sessionId);

  if (!recording) {
    throw new Error("Attach a recording before managing its availability window.");
  }

  const supabase = getSupabaseServiceClient() as any;
  const nextValues: Partial<{
    visible_to_parent: boolean;
    expires_at: string;
  }> = {};

  // These presets cover the common operational cases without forcing admins to hand-edit timestamps.
  switch (availabilityAction) {
    case "expire-now":
      nextValues.expires_at = new Date().toISOString();
      break;
    case "extend-7-days":
      nextValues.expires_at = getExtendedRecordingExpiryIso(recording.expires_at, 7);
      break;
    case "extend-30-days":
      nextValues.expires_at = getExtendedRecordingExpiryIso(recording.expires_at, 30);
      break;
    case "hide-from-parent":
      nextValues.visible_to_parent = false;
      break;
    case "show-to-parent":
      nextValues.visible_to_parent = true;
      break;
    default:
      throw new Error("Unknown recording availability action.");
  }

  const { error } = await supabase.from("academy_recordings").update(nextValues).eq("id", recording.id);

  if (error) {
    throw error;
  }

  await insertAcademyAuditEvent({
    actor: user,
    action: "recording.availability_updated",
    targetType: "academy_recording",
    targetId: recording.id,
    details: {
      sessionId,
      availabilityAction,
      nextVisibleToParent: nextValues.visible_to_parent ?? recording.visible_to_parent,
      nextExpiresAt: nextValues.expires_at ?? recording.expires_at,
    },
  });

  revalidateAdminPaths([
    "/admin/sessions",
    `/admin/sessions/${sessionId}`,
    `/admin/sessions/${sessionId}/recording`,
    "/parent",
    "/parent/sessions",
    `/parent/sessions/${sessionId}`,
    `/parent/sessions/${sessionId}/recording`,
  ]);
}

export async function validateAcademySessionNoteAction(formData: FormData) {
  const user = await requireAcademyAdminUser();

  const noteId = requireFormValue(formData, "note_id");
  const status = sanitizePlainText(String(formData.get("admin_status") ?? "validated"), {
    maxLength: 40,
  });

  if (!isAcademySessionNoteStatus(status)) {
    throw new Error("Invalid session note status.");
  }

  if (status === "emailed") {
    throw new Error("Use the recap email action to mark a session note as emailed.");
  }

  const supabase = getSupabaseServiceClient() as any;
  const note = await getAcademySessionNoteById(noteId);

  if (!note) {
    throw new Error("The selected session note was not found.");
  }

  const { error } = await supabase
    .from("academy_session_notes")
    .update({
      what_was_covered: requireFormValue(formData, "what_was_covered"),
      student_understood: requireFormValue(formData, "student_understood"),
      student_struggled_with: requireFormValue(formData, "student_struggled_with"),
      recommended_homework: optionalFormValue(formData, "recommended_homework", 1500),
      admin_status: status,
      admin_feedback: optionalFormValue(formData, "admin_feedback", 1500),
      validated_by: status === "validated" ? user.id : null,
      validated_at: status === "validated" ? new Date().toISOString() : null,
      // Keep note metadata aligned with the new database constraint when admins revise statuses.
      emailed_to_parent_at: null,
    })
    .eq("id", noteId);

  if (error) {
    throw error;
  }

  if (note.session_id) {
    await supabase
      .from("academy_sessions")
      .update({
        status: status === "validated" ? "notes_validated" : "notes_submitted",
      })
      .eq("id", note.session_id);
  }

  await insertAcademyAuditEvent({
    actor: user,
    action: "session_note.reviewed",
    targetType: "academy_session_note",
    targetId: noteId,
    details: { adminStatus: status, sessionId: note.session_id },
  });

  revalidateAdminPaths(["/admin/session-notes", `/admin/session-notes/${noteId}`]);
}

export async function sendAcademySessionRecapAction(formData: FormData) {
  const user = await requireAcademyAdminUser();

  const noteId = requireFormValue(formData, "note_id");
  const payload = await deliverSessionRecapEmail(noteId);

  const supabase = getSupabaseServiceClient() as any;
  await supabase
    .from("academy_session_notes")
    .update({
      admin_status: "emailed",
      emailed_to_parent_at: new Date().toISOString(),
    })
    .eq("id", noteId);

  await supabase
    .from("academy_sessions")
    .update({
      status: "recap_sent",
    })
    .eq("id", payload.session.id);

  await insertAcademyAuditEvent({
    actor: user,
    action: "session_note.recap_sent",
    targetType: "academy_session_note",
    targetId: noteId,
    targetEmail: payload.parent.email,
    details: { sessionId: payload.session.id },
  });

  revalidateAdminPaths([
    "/admin/session-notes",
    `/admin/session-notes/${noteId}`,
    `/admin/sessions/${payload.session.id}`,
    "/admin/emails",
    "/parent/sessions",
  ]);
}
