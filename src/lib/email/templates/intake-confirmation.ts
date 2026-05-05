type IntakeConfirmationTemplateInput = {
  referenceId: string;
  parentFullName: string;
  studentFirstName: string;
  grade: string;
  subjectLabel: string;
  courseName: string;
  formatLabel: string;
  upcomingDeadline: string;
  preferredAvailability: string;
};

export function renderIntakeConfirmationTemplate(input: IntakeConfirmationTemplateInput) {
  const safeReference = input.referenceId.slice(0, 8);
  const subjectLine = "We received your Deebo Academy intake";

  return {
    subject: subjectLine,
    text: [
      `Hi ${input.parentFullName},`,
      "",
      "Thanks for submitting a Deebo Academy intake form.",
      `Reference: ${safeReference}`,
      "",
      "We received your request and will review the course, current challenge, and scheduling details before recommending next steps.",
      "",
      `Student: ${input.studentFirstName}`,
      `Grade / level: ${input.grade}`,
      `Subject: ${input.subjectLabel}`,
      `Course: ${input.courseName}`,
      `Format: ${input.formatLabel}`,
      `Upcoming deadline: ${input.upcomingDeadline}`,
      `Availability: ${input.preferredAvailability}`,
      "",
      "Deebo Academy",
    ].join("\n"),
    html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
      <p>Hi ${input.parentFullName},</p>
      <p>Thanks for submitting a <strong>Deebo Academy</strong> intake form.</p>
      <p><strong>Reference:</strong> ${safeReference}</p>
      <p>We received your request and will review the course, current challenge, and scheduling details before recommending next steps.</p>
      <ul>
        <li><strong>Student:</strong> ${input.studentFirstName}</li>
        <li><strong>Grade / level:</strong> ${input.grade}</li>
        <li><strong>Subject:</strong> ${input.subjectLabel}</li>
        <li><strong>Course:</strong> ${input.courseName}</li>
        <li><strong>Format:</strong> ${input.formatLabel}</li>
        <li><strong>Upcoming deadline:</strong> ${input.upcomingDeadline}</li>
        <li><strong>Availability:</strong> ${input.preferredAvailability}</li>
      </ul>
      <p>Deebo Academy</p>
    </div>`,
  };
}
