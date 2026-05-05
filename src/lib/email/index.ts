import "server-only";

import { ACADEMY_SUPPORT_EMAIL } from "@/content/academy-content";
import { env, hasAcademyEmailEnv } from "@/lib/env";
import { sendAcademyEmail } from "@/lib/email/provider";
import { renderIntakeConfirmationTemplate } from "@/lib/email/templates/intake-confirmation";
import { renderIntakeNotificationTemplate } from "@/lib/email/templates/intake-notification";
import { renderPlacementExamTemplate } from "@/lib/email/templates/placement-exam";
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

export async function sendAcademyIntakeEmails(input: IntakeEmailInput) {
  if (!hasAcademyEmailEnv) {
    return { sent: false as const };
  }

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

  await Promise.all([
    sendAcademyEmail(
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
    ),
    sendAcademyEmail(
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
    ),
  ]);

  return { sent: true as const };
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
  if (!hasAcademyEmailEnv) {
    return { sent: false as const };
  }

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
  if (!hasAcademyEmailEnv) {
    return { sent: false as const };
  }

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

export async function sendAcademyPlacementExamEmail(input: {
  parentEmail: string;
  parentName: string;
  studentName: string;
  examName: string;
  examUrl: string;
  attemptId: string;
}) {
  if (!hasAcademyEmailEnv) {
    return { sent: false as const };
  }

  const template = renderPlacementExamTemplate({
    parentName: input.parentName,
    studentName: input.studentName,
    examName: input.examName,
    examUrl: input.examUrl,
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
        template: "placement-exam",
        relatedType: "placement_attempt",
        relatedId: input.attemptId,
      },
    },
  );
}
