type PlacementExamTemplateInput = {
  parentName: string;
  studentName: string;
  examName: string;
  examUrl: string;
};

export function renderPlacementExamTemplate(input: PlacementExamTemplateInput) {
  return {
    subject: `Deebo Academy Placement Exam for ${input.studentName}`,
    text: [
      `Hi ${input.parentName},`,
      "",
      `${input.studentName} has been assigned the Deebo Academy placement exam: ${input.examName}.`,
      `Exam link: ${input.examUrl}`,
      "",
      "Please complete the exam before the next intake review step.",
      "",
      "Deebo Academy",
    ].join("\n"),
    html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
      <p>Hi ${input.parentName},</p>
      <p><strong>${input.studentName}</strong> has been assigned the Deebo Academy placement exam: <strong>${input.examName}</strong>.</p>
      <p><a href="${input.examUrl}">Open the placement exam</a></p>
      <p>Please complete the exam before the next intake review step.</p>
      <p>Deebo Academy</p>
    </div>`,
  };
}
