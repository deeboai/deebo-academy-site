type SessionScheduledTemplateInput = {
  parentName: string;
  studentName: string;
  sessionDateLabel: string;
  subject: string;
  courseName: string | null;
  tutorName: string | null;
  meetingUrl: string | null;
};

export function renderSessionScheduledTemplate(input: SessionScheduledTemplateInput) {
  return {
    subject: `Deebo Academy Session Scheduled for ${input.studentName}`,
    text: [
      `Hi ${input.parentName},`,
      "",
      `A Deebo Academy session has been scheduled for ${input.studentName}.`,
      `Date and time: ${input.sessionDateLabel}`,
      `Subject: ${input.subject}`,
      `Course: ${input.courseName || "Not specified"}`,
      `Tutor: ${input.tutorName || "To be confirmed"}`,
      `Meeting link: ${input.meetingUrl || "Not attached yet"}`,
      "",
      "Deebo Academy",
    ].join("\n"),
    html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
      <p>Hi ${input.parentName},</p>
      <p>A <strong>Deebo Academy</strong> session has been scheduled for <strong>${input.studentName}</strong>.</p>
      <ul>
        <li><strong>Date and time:</strong> ${input.sessionDateLabel}</li>
        <li><strong>Subject:</strong> ${input.subject}</li>
        <li><strong>Course:</strong> ${input.courseName || "Not specified"}</li>
        <li><strong>Tutor:</strong> ${input.tutorName || "To be confirmed"}</li>
        <li><strong>Meeting link:</strong> ${
          input.meetingUrl
            ? `<a href="${input.meetingUrl}">${input.meetingUrl}</a>`
            : "Not attached yet"
        }</li>
      </ul>
      <p>Deebo Academy</p>
    </div>`,
  };
}
