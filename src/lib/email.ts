import "server-only";

import {
  ACADEMY_SUPPORT_EMAIL,
} from "@/content/academy-content";
import { assertAcademyEmailEnv, env, hasAcademyEmailEnv } from "@/lib/env";

type AcademyEmailInput = {
  referenceId: string;
  parentFullName: string;
  parentEmail: string;
  studentFirstName: string;
  grade: string;
  subjectLabel: string;
  formatLabel: string;
  goals: string;
};

type ResendEmailPayload = {
  from: string;
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  reply_to?: string;
};

async function sendResendEmail(payload: ResendEmailPayload) {
  assertAcademyEmailEnv();

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(`Resend email request failed: ${response.status} ${responseText}`);
  }
}

export async function sendAcademyIntakeEmails(input: AcademyEmailInput) {
  if (!hasAcademyEmailEnv) {
    return { sent: false as const };
  }

  const notificationAddress = env.academyNotificationEmail || ACADEMY_SUPPORT_EMAIL;
  const safeReference = input.referenceId.slice(0, 8);

  const contactText = [
    `Hi ${input.parentFullName},`,
    "",
    "Thanks for submitting a Deebo Academy intake form.",
    `Reference: ${safeReference}`,
    "",
    "We received your request and will follow up with next steps, scheduling guidance, and service details.",
    "",
    `Student: ${input.studentFirstName}`,
    `Grade: ${input.grade}`,
    `Subject: ${input.subjectLabel}`,
    `Format: ${input.formatLabel}`,
    "",
    "Deebo Academy",
  ].join("\n");

  const internalText = [
    "New Deebo Academy intake submission",
    `Reference: ${safeReference}`,
    `Booking contact: ${input.parentFullName}`,
    `Email: ${input.parentEmail}`,
    `Student: ${input.studentFirstName}`,
    `Grade: ${input.grade}`,
    `Subject: ${input.subjectLabel}`,
    `Format: ${input.formatLabel}`,
    "",
    "Goals / challenges:",
    input.goals,
  ].join("\n");

  await Promise.all([
    sendResendEmail({
      from: env.academyFromEmail,
      to: input.parentEmail,
      subject: "We received your Deebo Academy intake",
      html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
        <p>Hi ${input.parentFullName},</p>
        <p>Thanks for submitting a <strong>Deebo Academy</strong> intake form.</p>
        <p><strong>Reference:</strong> ${safeReference}</p>
        <p>We received your request and will follow up with next steps, scheduling guidance, and service details.</p>
        <ul>
          <li><strong>Student:</strong> ${input.studentFirstName}</li>
          <li><strong>Grade:</strong> ${input.grade}</li>
          <li><strong>Subject:</strong> ${input.subjectLabel}</li>
          <li><strong>Format:</strong> ${input.formatLabel}</li>
        </ul>
        <p>Deebo Academy</p>
      </div>`,
      text: contactText,
      reply_to: notificationAddress,
    }),
    sendResendEmail({
      from: env.academyFromEmail,
      to: notificationAddress,
      subject: `New Deebo Academy intake: ${input.studentFirstName} (${input.subjectLabel})`,
      html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
        <p><strong>New Deebo Academy intake submission</strong></p>
        <p><strong>Reference:</strong> ${safeReference}</p>
        <ul>
          <li><strong>Booking contact:</strong> ${input.parentFullName}</li>
          <li><strong>Email:</strong> ${input.parentEmail}</li>
          <li><strong>Student:</strong> ${input.studentFirstName}</li>
          <li><strong>Grade:</strong> ${input.grade}</li>
          <li><strong>Subject:</strong> ${input.subjectLabel}</li>
          <li><strong>Format:</strong> ${input.formatLabel}</li>
        </ul>
        <p><strong>Goals / challenges</strong></p>
        <p>${input.goals.replace(/\n/g, "<br />")}</p>
      </div>`,
      text: internalText,
      reply_to: input.parentEmail,
    }),
  ]);

  return { sent: true as const };
}
