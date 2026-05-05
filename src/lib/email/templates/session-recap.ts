type SessionRecapTemplateInput = {
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
};

export function renderSessionRecapTemplate(input: SessionRecapTemplateInput) {
  return {
    subject: `Deebo Academy Session Summary for ${input.studentName}`,
    text: [
      `Hi ${input.parentName},`,
      "",
      `Here is the Deebo Academy session summary for ${input.studentName}.`,
      `Session date: ${input.sessionDateLabel}`,
      `Subject: ${input.subject}`,
      `Course: ${input.courseName || "Not specified"}`,
      "",
      "What was covered:",
      input.whatWasCovered,
      "",
      "What the student understood well:",
      input.studentUnderstood,
      "",
      "What still needs reinforcement:",
      input.studentStruggledWith,
      "",
      "Homework / next steps:",
      input.recommendedHomework || "No homework was assigned.",
      "",
      `Recording link: ${input.recordingUrl || "No recording link is attached."}`,
      `Recording availability: ${input.recordingExpirationLabel || "Not applicable"}`,
      `Next scheduled session: ${input.nextSessionLabel || "No next session is scheduled yet."}`,
      "",
      "Deebo Academy",
    ].join("\n"),
    html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
      <p>Hi ${input.parentName},</p>
      <p>Here is the <strong>Deebo Academy</strong> session summary for <strong>${input.studentName}</strong>.</p>
      <ul>
        <li><strong>Session date:</strong> ${input.sessionDateLabel}</li>
        <li><strong>Subject:</strong> ${input.subject}</li>
        <li><strong>Course:</strong> ${input.courseName || "Not specified"}</li>
      </ul>
      <p><strong>What was covered</strong></p>
      <p>${input.whatWasCovered.replace(/\n/g, "<br />")}</p>
      <p><strong>What the student understood well</strong></p>
      <p>${input.studentUnderstood.replace(/\n/g, "<br />")}</p>
      <p><strong>What still needs reinforcement</strong></p>
      <p>${input.studentStruggledWith.replace(/\n/g, "<br />")}</p>
      <p><strong>Homework / next steps</strong></p>
      <p>${(input.recommendedHomework || "No homework was assigned.").replace(/\n/g, "<br />")}</p>
      <p><strong>Recording link:</strong> ${
        input.recordingUrl
          ? `<a href="${input.recordingUrl}">${input.recordingUrl}</a>`
          : "No recording link is attached."
      }</p>
      <p><strong>Recording availability:</strong> ${input.recordingExpirationLabel || "Not applicable"}</p>
      <p><strong>Next scheduled session:</strong> ${input.nextSessionLabel || "No next session is scheduled yet."}</p>
      <p>Deebo Academy</p>
    </div>`,
  };
}
