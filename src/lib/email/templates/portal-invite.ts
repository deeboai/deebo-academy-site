type PortalInviteTemplateInput = {
  recipientName: string;
  roleLabel: string;
  actionLink: string;
};

export function renderPortalInviteTemplate(input: PortalInviteTemplateInput) {
  return {
    subject: `Set up your Deebo Academy ${input.roleLabel.toLowerCase()} access`,
    text: [
      `Hi ${input.recipientName},`,
      "",
      `Your Deebo Academy ${input.roleLabel.toLowerCase()} access is ready.`,
      "Use the link below to finish account setup and create your password:",
      input.actionLink,
      "",
      "If you were not expecting this email, you can ignore it.",
      "",
      "Deebo Academy",
    ].join("\n"),
    html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
      <p>Hi ${input.recipientName},</p>
      <p>Your <strong>Deebo Academy</strong> ${input.roleLabel.toLowerCase()} access is ready.</p>
      <p>Use the link below to finish account setup and create your password.</p>
      <p><a href="${input.actionLink}">Set up Academy access</a></p>
      <p>If you were not expecting this email, you can ignore it.</p>
      <p>Deebo Academy</p>
    </div>`,
  };
}
