import "server-only";

import type { AcademyPortalAccountRole } from "@/lib/academy-data";
import { ACADEMY_SUPPORT_EMAIL } from "@/content/academy-content";
import { ACADEMY_FORMAT_OPTIONS, ACADEMY_SUBJECTS } from "@/content/academy-content";
import { env } from "@/lib/env";
import { sendAcademyEmail } from "@/lib/email/provider";
import { renderIntakeConfirmationTemplate } from "@/lib/email/templates/intake-confirmation";
import { renderIntakeNotificationTemplate } from "@/lib/email/templates/intake-notification";
import { renderPortalInviteTemplate } from "@/lib/email/templates/portal-invite";
import { renderPortalPasswordResetTemplate } from "@/lib/email/templates/portal-password-reset";
import { renderSessionRecapTemplate } from "@/lib/email/templates/session-recap";
import { renderSessionScheduledTemplate } from "@/lib/email/templates/session-scheduled";

type IntakeEmailInput = {
  referenceId: string;
  parentFullName: string;
  parentEmail: string;
  parentPhone: string | null;
  studentFirstName: string;
  grade: string;
  subjectLabel: string;
  courseName: string;
  schoolName: string | null;
  formatLabel: string;
  currentChallenge: string;
  upcomingDeadline: string;
  preferredAvailability: string;
  requestedLocation: string | null;
  referralSource: string | null;
};

export type AcademyEmailTemplatePreview = {
  id: string;
  label: string;
  description: string;
  subject: string;
  html: string;
};

function getAcademyPortalRoleLabel(role: AcademyPortalAccountRole) {
  switch (role) {
    case "admin":
      return "Admin";
    case "parent":
      return "Parent";
    case "student":
      return "Student";
    case "tutor":
      return "Tutor";
    default:
      return "Portal";
  }
}

function getIntakeSubjectLabel(subject: string) {
  return ACADEMY_SUBJECTS.find((candidate) => candidate.value === subject)?.label ?? subject;
}

function getIntakeFormatLabel(format: string) {
  return ACADEMY_FORMAT_OPTIONS.find((candidate) => candidate.value === format)?.label ?? format;
}

export async function sendAcademyIntakeConfirmationEmail(input: IntakeEmailInput) {
  const notificationAddress = env.academyNotificationEmail || ACADEMY_SUPPORT_EMAIL;
  const confirmationTemplate = renderIntakeConfirmationTemplate({
    referenceId: input.referenceId,
    parentFullName: input.parentFullName,
    studentFirstName: input.studentFirstName,
    grade: input.grade,
    subjectLabel: input.subjectLabel,
    courseName: input.courseName,
    formatLabel: input.formatLabel,
    upcomingDeadline: input.upcomingDeadline,
    preferredAvailability: input.preferredAvailability,
  });

  return sendAcademyEmail(
    {
      from: env.academyFromEmail,
      to: input.parentEmail,
      subject: confirmationTemplate.subject,
      html: confirmationTemplate.html,
      text: confirmationTemplate.text,
      reply_to: notificationAddress,
    },
    {
      log: {
        recipient: input.parentEmail,
        subject: confirmationTemplate.subject,
        template: "intake-confirmation",
        relatedType: "intake",
        relatedId: input.referenceId,
      },
    },
  );
}

export async function sendAcademyIntakeNotificationEmail(input: IntakeEmailInput) {
  const notificationAddress = env.academyNotificationEmail || ACADEMY_SUPPORT_EMAIL;
  const notificationTemplate = renderIntakeNotificationTemplate({
    referenceId: input.referenceId,
    parentFullName: input.parentFullName,
    parentEmail: input.parentEmail,
    parentPhone: input.parentPhone,
    studentFirstName: input.studentFirstName,
    grade: input.grade,
    subjectLabel: input.subjectLabel,
    courseName: input.courseName,
    schoolName: input.schoolName,
    formatLabel: input.formatLabel,
    requestedLocation: input.requestedLocation,
    upcomingDeadline: input.upcomingDeadline,
    preferredAvailability: input.preferredAvailability,
    referralSource: input.referralSource,
    currentChallenge: input.currentChallenge,
  });

  return sendAcademyEmail(
    {
      from: env.academyFromEmail,
      to: notificationAddress,
      subject: notificationTemplate.subject,
      html: notificationTemplate.html,
      text: notificationTemplate.text,
      reply_to: input.parentEmail,
    },
    {
      log: {
        recipient: notificationAddress,
        subject: notificationTemplate.subject,
        template: "intake-notification",
        relatedType: "intake",
        relatedId: input.referenceId,
      },
    },
  );
}

export async function sendAcademyIntakeEmails(input: IntakeEmailInput) {
  const results = await Promise.all([
    sendAcademyIntakeConfirmationEmail(input),
    sendAcademyIntakeNotificationEmail(input),
  ]);

  return { sent: results.every((result) => result.sent) };
}

export async function sendAcademySessionScheduledEmail(input: {
  parentEmail: string;
  parentName: string;
  studentName: string;
  sessionDateLabel: string;
  subject: string;
  courseName: string | null;
  tutorName: string | null;
  meetingUrl: string | null;
  sessionId: string;
}) {
  const template = renderSessionScheduledTemplate({
    parentName: input.parentName,
    studentName: input.studentName,
    sessionDateLabel: input.sessionDateLabel,
    subject: input.subject,
    courseName: input.courseName,
    tutorName: input.tutorName,
    meetingUrl: input.meetingUrl,
  });

  return sendAcademyEmail(
    {
      from: env.academyFromEmail,
      to: input.parentEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
      reply_to: env.academyNotificationEmail || ACADEMY_SUPPORT_EMAIL,
    },
    {
      log: {
        recipient: input.parentEmail,
        subject: template.subject,
        template: "session-scheduled",
        relatedType: "session",
        relatedId: input.sessionId,
      },
    },
  );
}

export async function sendAcademyPortalInviteEmail(input: {
  recipientEmail: string;
  recipientName: string;
  role: AcademyPortalAccountRole;
  actionLink: string;
  accountId: string;
}) {
  const template = renderPortalInviteTemplate({
    recipientName: input.recipientName,
    roleLabel: getAcademyPortalRoleLabel(input.role),
    actionLink: input.actionLink,
  });

  return sendAcademyEmail(
    {
      from: env.academyFromEmail,
      to: input.recipientEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
      reply_to: env.academyNotificationEmail || ACADEMY_SUPPORT_EMAIL,
    },
    {
      log: {
        recipient: input.recipientEmail,
        subject: template.subject,
        template: "portal-invite",
        relatedType: "portal_account",
        relatedId: input.accountId,
      },
    },
  );
}

export async function sendAcademyPortalPasswordResetEmail(input: {
  recipientEmail: string;
  recipientName: string;
  role: AcademyPortalAccountRole;
  actionLink: string;
  accountId: string;
}) {
  const template = renderPortalPasswordResetTemplate({
    recipientName: input.recipientName,
    roleLabel: getAcademyPortalRoleLabel(input.role),
    actionLink: input.actionLink,
  });

  return sendAcademyEmail(
    {
      from: env.academyFromEmail,
      to: input.recipientEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
      reply_to: env.academyNotificationEmail || ACADEMY_SUPPORT_EMAIL,
    },
    {
      log: {
        recipient: input.recipientEmail,
        subject: template.subject,
        template: "portal-password-reset",
        relatedType: "portal_account",
        relatedId: input.accountId,
      },
    },
  );
}

export function getAcademyEmailTemplatePreviews() {
  return [
    {
      id: "portal-invite",
      label: "Portal invite",
      description: "Sent when an Academy admin invites a parent, tutor, student, or admin to finish account setup.",
      ...renderPortalInviteTemplate({
        recipientName: "Jordan Carter",
        roleLabel: "Parent",
        actionLink: "https://academy.example.com/auth/setup?token=sample-invite",
      }),
    },
    {
      id: "portal-password-reset",
      label: "Portal password reset",
      description: "Sent when an Academy admin issues a password reset from the access workflow.",
      ...renderPortalPasswordResetTemplate({
        recipientName: "Jordan Carter",
        roleLabel: "Parent",
        actionLink: "https://academy.example.com/auth/reset?token=sample-reset",
      }),
    },
    {
      id: "intake-confirmation",
      label: "Intake confirmation",
      description: "Sent to the parent contact immediately after a new intake is submitted.",
      ...renderIntakeConfirmationTemplate({
        referenceId: "12345678-abcd",
        parentFullName: "Jordan Carter",
        studentFirstName: "Maya",
        grade: "10th grade",
        subjectLabel: getIntakeSubjectLabel("chemistry"),
        courseName: "Honors Chemistry",
        formatLabel: getIntakeFormatLabel("online"),
        upcomingDeadline: "Quiz next Thursday",
        preferredAvailability: "Weekdays after 6 PM",
      }),
    },
    {
      id: "intake-notification",
      label: "Intake notification",
      description: "Sent internally so Academy admins can follow new intake work without opening Supabase.",
      ...renderIntakeNotificationTemplate({
        referenceId: "12345678-abcd",
        parentFullName: "Jordan Carter",
        parentEmail: "parent@example.com",
        parentPhone: "(555) 111-2222",
        studentFirstName: "Maya",
        grade: "10th grade",
        subjectLabel: getIntakeSubjectLabel("chemistry"),
        courseName: "Honors Chemistry",
        schoolName: "Westfield High School",
        formatLabel: getIntakeFormatLabel("online"),
        requestedLocation: null,
        upcomingDeadline: "Quiz next Thursday",
        preferredAvailability: "Weekdays after 6 PM",
        referralSource: "Word of mouth",
        currentChallenge: "Stoichiometry setup and lab writeups.",
      }),
    },
    {
      id: "session-scheduled",
      label: "Session scheduled",
      description: "Sent when a session is scheduled or when the admin resends the scheduling details.",
      ...renderSessionScheduledTemplate({
        parentName: "Jordan Carter",
        studentName: "Maya Carter",
        sessionDateLabel: "May 15, 2026 at 6:30 PM",
        subject: "Chemistry",
        courseName: "Honors Chemistry",
        tutorName: "Alex Johnson",
        meetingUrl: "https://meet.google.com/example-link",
      }),
    },
    {
      id: "session-recap",
      label: "Session recap",
      description: "Sent after an admin validates tutor notes and emails the parent-facing recap.",
      ...renderSessionRecapTemplate({
        parentName: "Jordan Carter",
        studentName: "Maya Carter",
        sessionDateLabel: "May 15, 2026 at 6:30 PM",
        subject: "Chemistry",
        courseName: "Honors Chemistry",
        whatWasCovered: "Balanced chemical equations and stoichiometric ratios.",
        studentUnderstood: "Converting between grams and moles once the equation is balanced.",
        studentStruggledWith: "Setting up limiting reactant problems cleanly.",
        recommendedHomework: "Redo worksheet problems 5 through 10 without notes.",
        recordingUrl: "https://academy.example.com/recordings/example",
        recordingExpirationLabel: "May 22, 2026",
        nextSessionLabel: "May 20, 2026 at 6:30 PM",
      }),
    },
  ] satisfies AcademyEmailTemplatePreview[];
}

export async function sendAcademySessionRecapEmail(input: {
  parentEmail: string;
  parentName: string;
  studentName: string;
  sessionDateLabel: string;
  subject: string;
  courseName: string | null;
  whatWasCovered: string;
  studentUnderstood: string;
  studentStruggledWith: string;
  recommendedHomework: string | null;
  recordingUrl: string | null;
  recordingExpirationLabel: string | null;
  nextSessionLabel: string | null;
  noteId: string;
}) {
  const template = renderSessionRecapTemplate({
    parentName: input.parentName,
    studentName: input.studentName,
    sessionDateLabel: input.sessionDateLabel,
    subject: input.subject,
    courseName: input.courseName,
    whatWasCovered: input.whatWasCovered,
    studentUnderstood: input.studentUnderstood,
    studentStruggledWith: input.studentStruggledWith,
    recommendedHomework: input.recommendedHomework,
    recordingUrl: input.recordingUrl,
    recordingExpirationLabel: input.recordingExpirationLabel,
    nextSessionLabel: input.nextSessionLabel,
  });

  return sendAcademyEmail(
    {
      from: env.academyFromEmail,
      to: input.parentEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
      reply_to: env.academyNotificationEmail || ACADEMY_SUPPORT_EMAIL,
    },
    {
      log: {
        recipient: input.parentEmail,
        subject: template.subject,
        template: "session-recap",
        relatedType: "session_note",
        relatedId: input.noteId,
      },
    },
  );
}
