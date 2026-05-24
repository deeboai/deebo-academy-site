import "server-only";

import { ACADEMY_SUPPORT_EMAIL } from "@/content/academy-content";
import { env } from "@/lib/env";
import { sendAcademyEmail } from "@/lib/email/provider";
import { renderIntakeConfirmationTemplate } from "@/lib/email/templates/intake-confirmation";
import { renderIntakeNotificationTemplate } from "@/lib/email/templates/intake-notification";

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
