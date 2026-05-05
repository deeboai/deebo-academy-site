type IntakeNotificationTemplateInput = {
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
  requestedLocation: string | null;
  upcomingDeadline: string;
  preferredAvailability: string;
  referralSource: string | null;
  currentChallenge: string;
};

export function renderIntakeNotificationTemplate(input: IntakeNotificationTemplateInput) {
  const safeReference = input.referenceId.slice(0, 8);

  return {
    subject: `New Deebo Academy intake: ${input.studentFirstName} (${input.subjectLabel})`,
    text: [
      "New Deebo Academy intake submission",
      `Reference: ${safeReference}`,
      `Booking contact: ${input.parentFullName}`,
      `Email: ${input.parentEmail}`,
      `Phone: ${input.parentPhone || "Not provided"}`,
      `Student: ${input.studentFirstName}`,
      `Grade / level: ${input.grade}`,
      `Subject: ${input.subjectLabel}`,
      `Course: ${input.courseName}`,
      `School: ${input.schoolName || "Not provided"}`,
      `Format: ${input.formatLabel}`,
      `Requested location: ${input.requestedLocation || "Not provided"}`,
      `Upcoming deadline: ${input.upcomingDeadline}`,
      `Availability: ${input.preferredAvailability}`,
      `Referral source: ${input.referralSource || "Not provided"}`,
      "",
      "Current challenge:",
      input.currentChallenge,
    ].join("\n"),
    html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
      <p><strong>New Deebo Academy intake submission</strong></p>
      <p><strong>Reference:</strong> ${safeReference}</p>
      <ul>
        <li><strong>Booking contact:</strong> ${input.parentFullName}</li>
        <li><strong>Email:</strong> ${input.parentEmail}</li>
        <li><strong>Phone:</strong> ${input.parentPhone || "Not provided"}</li>
        <li><strong>Student:</strong> ${input.studentFirstName}</li>
        <li><strong>Grade / level:</strong> ${input.grade}</li>
        <li><strong>Subject:</strong> ${input.subjectLabel}</li>
        <li><strong>Course:</strong> ${input.courseName}</li>
        <li><strong>School:</strong> ${input.schoolName || "Not provided"}</li>
        <li><strong>Format:</strong> ${input.formatLabel}</li>
        <li><strong>Requested location:</strong> ${input.requestedLocation || "Not provided"}</li>
        <li><strong>Upcoming deadline:</strong> ${input.upcomingDeadline}</li>
        <li><strong>Availability:</strong> ${input.preferredAvailability}</li>
        <li><strong>Referral source:</strong> ${input.referralSource || "Not provided"}</li>
      </ul>
      <p><strong>Current challenge</strong></p>
      <p>${input.currentChallenge.replace(/\n/g, "<br />")}</p>
    </div>`,
  };
}
