"use server";

import { revalidatePath } from "next/cache";

import { sendAcademyPlacementExamEmail, sendAcademySessionRecapEmail, sendAcademySessionScheduledEmail } from "@/lib/email";
import { requireAcademyAdminUser } from "@/lib/auth/academy-admin";
import { getSupabaseServiceClient } from "@/lib/supabase/service";
import {
  getAcademyParentById,
  getAcademyParentByEmail,
  getAcademyPlacementAttemptById,
  getAcademyPlacementExamById,
  getAcademyPlacementQuestionsByExamId,
  getAcademyRecordingBySessionId,
  getAcademySessionById,
  getAcademySessionNoteById,
  getAcademyStudentById,
  getAcademyStudentUserByStudentId,
  getAcademyTutorById,
} from "@/lib/academy-data";
import {
  type AcademyIntakeStatus,
  isAcademyIntakeStatus,
} from "@/lib/academy-intake";
import {
  isAcademyPaymentStatus,
  isAcademySessionNoteStatus,
  isAcademySessionStatus,
  type AcademyPlacementQuestionType,
  isAcademyPlacementQuestionType,
} from "@/lib/academy-os";
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

function revalidateAdminPaths(paths: string[]) {
  for (const routePath of paths) {
    revalidatePath(routePath);
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
      placement_required: false,
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

  revalidateAdminPaths([
    "/admin",
    "/admin/intake",
    `/admin/intake/${submission.id}`,
    "/admin/parents",
    "/admin/students",
  ]);
}

export async function upsertAcademyTutorAction(formData: FormData) {
  await requireAcademyAdminUser();

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

  if (tutorId) {
    const { error } = await supabase.from("academy_tutors").update(payload).eq("id", tutorId);

    if (error) {
      throw error;
    }
  } else {
    const { error } = await supabase.from("academy_tutors").insert(payload);

    if (error) {
      throw error;
    }
  }

  revalidateAdminPaths(["/admin", "/admin/tutors"]);
}

export async function assignTutorToStudentSubjectAction(formData: FormData) {
  await requireAcademyAdminUser();

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

  revalidateAdminPaths(["/admin/students", "/admin/tutors"]);
}

export async function updateAcademyParentAction(formData: FormData) {
  await requireAcademyAdminUser();

  const parentId = requireFormValue(formData, "parent_id");
  const supabase = getSupabaseServiceClient() as any;
  const { error } = await supabase
    .from("academy_parents")
    .update({
      full_name: requireFormValue(formData, "full_name"),
      email: sanitizeEmailAddress(requireFormValue(formData, "email")),
      phone: optionalFormValue(formData, "phone", 30),
      stripe_customer_id: optionalFormValue(formData, "stripe_customer_id", 120),
    })
    .eq("id", parentId);

  if (error) {
    throw error;
  }

  revalidateAdminPaths(["/admin/parents", `/admin/parents/${parentId}`]);
}

export async function createAcademyParentAction(formData: FormData) {
  await requireAcademyAdminUser();

  const supabase = getSupabaseServiceClient() as any;
  const { error } = await supabase.from("academy_parents").insert({
    full_name: requireFormValue(formData, "full_name"),
    email: sanitizeEmailAddress(requireFormValue(formData, "email")),
    phone: optionalFormValue(formData, "phone", 30),
    stripe_customer_id: optionalFormValue(formData, "stripe_customer_id", 120),
  });

  if (error) {
    throw error;
  }

  revalidateAdminPaths(["/admin/parents", "/admin/students"]);
}

export async function updateAcademyStudentAction(formData: FormData) {
  await requireAcademyAdminUser();

  const studentId = requireFormValue(formData, "student_id");
  const parentId = String(formData.get("parent_id") ?? "").trim() || null;
  const supabase = getSupabaseServiceClient() as any;
  const { error } = await supabase
    .from("academy_students")
    .update({
      parent_id: parentId,
      first_name: requireFormValue(formData, "first_name"),
      last_name: optionalFormValue(formData, "last_name", 80),
      grade: requireFormValue(formData, "grade"),
      school_name: optionalFormValue(formData, "school_name", 120),
      status: sanitizePlainText(String(formData.get("status") ?? "active"), { maxLength: 40 }),
    })
    .eq("id", studentId);

  if (error) {
    throw error;
  }

  revalidateAdminPaths(["/admin/students", `/admin/students/${studentId}`]);
}

export async function createAcademyStudentAction(formData: FormData) {
  await requireAcademyAdminUser();

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

  if (parentMode === "existing" && selectedParentId) {
    parentId = selectedParentId;
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
  }

  const { data: studentRow, error: studentInsertError } = await supabase
    .from("academy_students")
    .insert({
      parent_id: parentId,
      first_name: requireFormValue(formData, "first_name"),
      last_name: optionalFormValue(formData, "last_name", 80),
      grade: requireFormValue(formData, "grade"),
      school_name: optionalFormValue(formData, "school_name", 120),
      status: sanitizePlainText(String(formData.get("status") ?? "active"), { maxLength: 40 }),
    })
    .select("id")
    .single();

  if (studentInsertError) {
    throw studentInsertError;
  }

  const studentId = String(studentRow.id);

  if (initialSubject) {
    const { error: subjectInsertError } = await supabase.from("academy_student_subjects").insert({
      student_id: studentId,
      subject: initialSubject,
      course_name: initialCourseName || null,
      level: initialLevel || null,
    });

    if (subjectInsertError) {
      throw subjectInsertError;
    }
  }

  if (studentPortalEmail) {
    const { error: studentUserInsertError } = await supabase.from("academy_student_users").insert({
      student_id: studentId,
      email: studentPortalEmail,
      status: "active",
    });

    if (studentUserInsertError) {
      throw studentUserInsertError;
    }
  }

  revalidateAdminPaths(["/admin/students", "/admin/parents", `/admin/students/${studentId}`]);
}

export async function upsertAcademyStudentUserAction(formData: FormData) {
  await requireAcademyAdminUser();

  const studentId = requireFormValue(formData, "student_id");
  const email = sanitizeEmailAddress(requireFormValue(formData, "email"));
  const existingStudentUser = await getAcademyStudentUserByStudentId(studentId);
  const supabase = getSupabaseServiceClient() as any;
  const payload = {
    student_id: studentId,
    email,
    status: sanitizePlainText(String(formData.get("status") ?? "active"), { maxLength: 40 }),
  };

  if (existingStudentUser) {
    const { error } = await supabase
      .from("academy_student_users")
      .update(payload)
      .eq("id", existingStudentUser.id);

    if (error) {
      throw error;
    }
  } else {
    const { error } = await supabase.from("academy_student_users").insert(payload);

    if (error) {
      throw error;
    }
  }

  revalidateAdminPaths(["/admin/students", `/admin/students/${studentId}`, "/student"]);
}

export async function createAcademySessionAction(formData: FormData) {
  await requireAcademyAdminUser();

  const supabase = getSupabaseServiceClient() as any;
  const studentId = requireFormValue(formData, "student_id");
  const parentId = requireFormValue(formData, "parent_id");
  const tutorId = String(formData.get("tutor_id") ?? "").trim() || null;
  const studentSubjectId = String(formData.get("student_subject_id") ?? "").trim() || null;
  const startsAt = requireFormValue(formData, "starts_at");
  const endsAt = requireFormValue(formData, "ends_at");
  const status = sanitizePlainText(String(formData.get("status") ?? "scheduled"), {
    maxLength: 40,
  });

  if (!isAcademySessionStatus(status)) {
    throw new Error("Invalid session status.");
  }

  const insertPayload = {
    student_id: studentId,
    parent_id: parentId,
    tutor_id: tutorId,
    student_subject_id: studentSubjectId,
    subject: requireFormValue(formData, "subject"),
    course_name: optionalFormValue(formData, "course_name", 120),
    starts_at: new Date(startsAt).toISOString(),
    ends_at: new Date(endsAt).toISOString(),
    format: sanitizePlainText(String(formData.get("format") ?? "online"), { maxLength: 40 }),
    location: optionalFormValue(formData, "location", 160),
    meeting_url: optionalFormValue(formData, "meeting_url", 500),
    google_calendar_event_id: optionalFormValue(formData, "google_calendar_event_id", 160),
    status,
    payment_status: sanitizePlainText(String(formData.get("payment_status") ?? "unpaid"), {
      maxLength: 40,
    }),
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
  const parent = await getAcademyParentById(parentId);
  const student = await getAcademyStudentById(studentId);
  const tutor = tutorId ? await getAcademyTutorById(tutorId) : null;

  if (parent && student) {
    const sessionDateLabel = new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(startsAt));

    try {
      await sendAcademySessionScheduledEmail({
        parentEmail: parent.email,
        parentName: parent.full_name,
        studentName: `${student.first_name}${student.last_name ? ` ${student.last_name}` : ""}`,
        sessionDateLabel,
        subject: insertPayload.subject,
        courseName: insertPayload.course_name,
        tutorName: tutor?.full_name ?? null,
        meetingUrl: insertPayload.meeting_url,
        sessionId,
      });
    } catch (emailError) {
      console.error("Academy scheduled session email delivery failed", emailError);
    }
  }

  revalidateAdminPaths(["/admin", "/admin/sessions"]);
}

export async function updateAcademySessionAction(formData: FormData) {
  await requireAcademyAdminUser();

  const sessionId = requireFormValue(formData, "session_id");
  const status = sanitizePlainText(String(formData.get("status") ?? "scheduled"), {
    maxLength: 40,
  });

  if (!isAcademySessionStatus(status)) {
    throw new Error("Invalid session status.");
  }

  const supabase = getSupabaseServiceClient() as any;
  const { error } = await supabase
    .from("academy_sessions")
    .update({
      subject: requireFormValue(formData, "subject"),
      course_name: optionalFormValue(formData, "course_name", 120),
      starts_at: new Date(requireFormValue(formData, "starts_at")).toISOString(),
      ends_at: new Date(requireFormValue(formData, "ends_at")).toISOString(),
      format: sanitizePlainText(String(formData.get("format") ?? "online"), { maxLength: 40 }),
      location: optionalFormValue(formData, "location", 160),
      meeting_url: optionalFormValue(formData, "meeting_url", 500),
      google_calendar_event_id: optionalFormValue(formData, "google_calendar_event_id", 160),
      status,
      payment_status: sanitizePlainText(String(formData.get("payment_status") ?? "unpaid"), {
        maxLength: 40,
      }),
    })
    .eq("id", sessionId);

  if (error) {
    throw error;
  }

  revalidateAdminPaths(["/admin/sessions", `/admin/sessions/${sessionId}`]);
}

export async function createAcademyPaymentAction(formData: FormData) {
  await requireAcademyAdminUser();

  const status = sanitizePlainText(String(formData.get("status") ?? "pending"), {
    maxLength: 40,
  });

  if (!isAcademyPaymentStatus(status)) {
    throw new Error("Invalid payment status.");
  }

  const supabase = getSupabaseServiceClient() as any;
  const { error } = await supabase.from("academy_payments").insert({
    parent_id: requireFormValue(formData, "parent_id"),
    student_id: requireFormValue(formData, "student_id"),
    session_id: String(formData.get("session_id") ?? "").trim() || null,
    stripe_customer_id: optionalFormValue(formData, "stripe_customer_id", 160),
    stripe_checkout_session_id: optionalFormValue(formData, "stripe_checkout_session_id", 160),
    stripe_invoice_id: optionalFormValue(formData, "stripe_invoice_id", 160),
    stripe_payment_intent_id: optionalFormValue(formData, "stripe_payment_intent_id", 160),
    amount_cents: Number.parseInt(requireFormValue(formData, "amount_cents"), 10),
    currency: sanitizePlainText(String(formData.get("currency") ?? "usd"), { maxLength: 10 }),
    status,
    description: optionalFormValue(formData, "description", 300),
  });

  if (error) {
    throw error;
  }

  revalidateAdminPaths(["/admin/payments"]);
}

export async function updateAcademyPaymentAction(formData: FormData) {
  await requireAcademyAdminUser();

  const paymentId = requireFormValue(formData, "payment_id");
  const status = sanitizePlainText(String(formData.get("status") ?? "pending"), {
    maxLength: 40,
  });

  if (!isAcademyPaymentStatus(status)) {
    throw new Error("Invalid payment status.");
  }

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

  revalidateAdminPaths(["/admin/payments", `/admin/payments/${paymentId}`]);
}

export async function attachAcademyRecordingAction(formData: FormData) {
  await requireAcademyAdminUser();

  const sessionId = requireFormValue(formData, "session_id");
  const existingRecording = await getAcademyRecordingBySessionId(sessionId);
  const supabase = getSupabaseServiceClient() as any;
  const payload = {
    session_id: sessionId,
    recording_url: requireFormValue(formData, "recording_url"),
    storage_provider: sanitizePlainText(String(formData.get("storage_provider") ?? "manual"), {
      maxLength: 40,
    }),
    visible_to_parent: String(formData.get("visible_to_parent") ?? "") === "on",
    expires_at: new Date(requireFormValue(formData, "expires_at")).toISOString(),
  };

  if (existingRecording) {
    const { error } = await supabase
      .from("academy_recordings")
      .update(payload)
      .eq("id", existingRecording.id);

    if (error) {
      throw error;
    }
  } else {
    const { error } = await supabase.from("academy_recordings").insert(payload);

    if (error) {
      throw error;
    }
  }

  revalidateAdminPaths(["/admin/sessions", `/admin/sessions/${sessionId}`, "/parent/sessions"]);
}

export async function validateAcademySessionNoteAction(formData: FormData) {
  await requireAcademyAdminUser();

  const noteId = requireFormValue(formData, "note_id");
  const status = sanitizePlainText(String(formData.get("admin_status") ?? "validated"), {
    maxLength: 40,
  });

  if (!isAcademySessionNoteStatus(status)) {
    throw new Error("Invalid session note status.");
  }

  const user = await requireAcademyAdminUser();
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
      validated_by: status === "validated" || status === "emailed" ? user.id : null,
      validated_at:
        status === "validated" || status === "emailed" ? new Date().toISOString() : null,
    })
    .eq("id", noteId);

  if (error) {
    throw error;
  }

  if (note.session_id && (status === "validated" || status === "emailed")) {
    await supabase
      .from("academy_sessions")
      .update({
        status: status === "emailed" ? "recap_sent" : "notes_validated",
      })
      .eq("id", note.session_id);
  }

  revalidateAdminPaths(["/admin/session-notes", `/admin/session-notes/${noteId}`]);
}

export async function sendAcademySessionRecapAction(formData: FormData) {
  await requireAcademyAdminUser();

  const noteId = requireFormValue(formData, "note_id");
  const note = await getAcademySessionNoteById(noteId);

  if (!note || !note.session_id) {
    throw new Error("The selected session note was not found.");
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

  if (!parent || !student) {
    throw new Error("The linked parent or student record was not found.");
  }

  const sessionDateLabel = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(session.starts_at));
  const recordingExpirationLabel = recording
    ? new Intl.DateTimeFormat("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }).format(new Date(recording.expires_at))
    : null;

  const supabase = getSupabaseServiceClient() as any;
  const { data: nextSessionData } = await supabase
    .from("academy_sessions")
    .select("starts_at")
    .eq("student_id", student.id)
    .gt("starts_at", session.starts_at)
    .order("starts_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const nextSessionLabel = nextSessionData?.starts_at
    ? new Intl.DateTimeFormat("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date(nextSessionData.starts_at))
    : null;

  await sendAcademySessionRecapEmail({
    parentEmail: parent.email,
    parentName: parent.full_name,
    studentName: `${student.first_name}${student.last_name ? ` ${student.last_name}` : ""}`,
    sessionDateLabel,
    subject: session.subject,
    courseName: session.course_name,
    whatWasCovered: note.what_was_covered,
    studentUnderstood: note.student_understood,
    studentStruggledWith: note.student_struggled_with,
    recommendedHomework: note.recommended_homework,
    recordingUrl:
      recording && recording.visible_to_parent && new Date(recording.expires_at) > new Date()
        ? recording.recording_url
        : null,
    recordingExpirationLabel,
    nextSessionLabel,
    noteId,
  });

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
    .eq("id", session.id);

  revalidateAdminPaths([
    "/admin/session-notes",
    `/admin/session-notes/${noteId}`,
    `/admin/sessions/${session.id}`,
    "/parent/sessions",
  ]);
}

export async function createAcademyPlacementExamAction(formData: FormData) {
  await requireAcademyAdminUser();

  const supabase = getSupabaseServiceClient() as any;
  const { error } = await supabase.from("academy_placement_exams").insert({
    name: requireFormValue(formData, "name"),
    subject: requireFormValue(formData, "subject"),
    grade_band: optionalFormValue(formData, "grade_band", 80),
    description: optionalFormValue(formData, "description", 1000),
    status: sanitizePlainText(String(formData.get("status") ?? "active"), { maxLength: 40 }),
  });

  if (error) {
    throw error;
  }

  revalidateAdminPaths(["/admin/placement"]);
}

export async function createAcademyPlacementQuestionAction(formData: FormData) {
  await requireAcademyAdminUser();

  const questionType = sanitizePlainText(String(formData.get("question_type") ?? ""), {
    maxLength: 40,
  });

  if (!isAcademyPlacementQuestionType(questionType)) {
    throw new Error("Invalid placement question type.");
  }

  const choicesValue = optionalFormValue(formData, "choices", 2000);
  const parsedChoices =
    questionType === "multiple_choice" && choicesValue
      ? choicesValue
          .split("\n")
          .map((choice) => choice.trim())
          .filter(Boolean)
          .map((choice) => ({
            label: choice,
            value: choice,
          }))
      : null;
  const supabase = getSupabaseServiceClient() as any;
  const { error } = await supabase.from("academy_placement_questions").insert({
    exam_id: requireFormValue(formData, "exam_id"),
    subject: requireFormValue(formData, "subject"),
    grade_band: optionalFormValue(formData, "grade_band", 80),
    topic: requireFormValue(formData, "topic"),
    question_type: questionType as AcademyPlacementQuestionType,
    question_text: requireFormValue(formData, "question_text"),
    choices: parsedChoices,
    correct_answer: optionalFormValue(formData, "correct_answer", 500),
    rubric: optionalFormValue(formData, "rubric", 2000),
    difficulty: optionalFormValue(formData, "difficulty", 40) ?? "medium",
    points: Number.parseFloat(requireFormValue(formData, "points")),
  });

  if (error) {
    throw error;
  }

  revalidateAdminPaths(["/admin/placement"]);
}

export async function assignAcademyPlacementAttemptAction(formData: FormData) {
  await requireAcademyAdminUser();

  const examId = requireFormValue(formData, "exam_id");
  const intakeId = String(formData.get("intake_id") ?? "").trim() || null;
  const studentId = String(formData.get("student_id") ?? "").trim() || null;
  const parentId = requireFormValue(formData, "parent_id");
  const parent = await getAcademyParentById(parentId);
  const exam = await getAcademyPlacementExamById(examId);
  const student = studentId ? await getAcademyStudentById(studentId) : null;

  if (!parent || !exam) {
    throw new Error("The selected parent or placement exam was not found.");
  }

  const supabase = getSupabaseServiceClient() as any;
  const { data: attemptRow, error } = await supabase
    .from("academy_placement_attempts")
    .insert({
      intake_id: intakeId,
      student_id: studentId,
      exam_id: examId,
      status: "assigned",
    })
    .select("id, access_token")
    .single();

  if (error) {
    throw error;
  }

  const attemptId = String(attemptRow.id);
  const examUrl = `https://academy.deeboai.com/placement/${attemptId}?token=${attemptRow.access_token}`;

  if (parent.email) {
    try {
      await sendAcademyPlacementExamEmail({
        parentEmail: parent.email,
        parentName: parent.full_name,
        studentName: student
          ? `${student.first_name}${student.last_name ? ` ${student.last_name}` : ""}`
          : "your student",
        examName: exam.name,
        examUrl,
        attemptId,
      });
    } catch (emailError) {
      console.error("Academy placement email delivery failed", emailError);
    }
  }

  revalidateAdminPaths(["/admin/placement", "/admin/intake"]);
}

export async function reviewAcademyPlacementAttemptAction(formData: FormData) {
  await requireAcademyAdminUser();

  const user = await requireAcademyAdminUser();
  const attemptId = requireFormValue(formData, "attempt_id");
  const attempt = await getAcademyPlacementAttemptById(attemptId);

  if (!attempt) {
    throw new Error("The selected placement attempt was not found.");
  }

  const adminRecommendation = optionalFormValue(formData, "admin_recommendation", 1500);
  const totalScoreRaw = String(formData.get("total_score") ?? "").trim();
  const totalScore = totalScoreRaw ? Number.parseFloat(totalScoreRaw) : null;
  const supabase = getSupabaseServiceClient() as any;
  const { error } = await supabase
    .from("academy_placement_attempts")
    .update({
      admin_recommendation: adminRecommendation,
      total_score: totalScore,
      status: "reviewed",
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", attemptId);

  if (error) {
    throw error;
  }

  revalidateAdminPaths(["/admin/placement", `/admin/placement/${attemptId}`]);
}
