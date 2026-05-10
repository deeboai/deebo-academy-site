type PortalPasswordResetTemplateInput = {
  recipientName: string;
  roleLabel: string;
  actionLink: string;
};

export function renderPortalPasswordResetTemplate(input: PortalPasswordResetTemplateInput) {
  return {
    subject: `Reset your Deebo Academy ${input.roleLabel.toLowerCase()} password`,
    text: [
      `Hi ${input.recipientName},`,
      "",
      `A password reset was requested for your Deebo Academy ${input.roleLabel.toLowerCase()} access.`,
      "Use the link below to choose a new password:",
      input.actionLink,
      "",
      "If you did not request this change, contact Deebo Academy support.",
      "",
      "Deebo Academy",
    ].join("\n"),
    html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
      <p>Hi ${input.recipientName},</p>
      <p>A password reset was requested for your <strong>Deebo Academy</strong> ${input.roleLabel.toLowerCase()} access.</p>
      <p>Use the link below to choose a new password.</p>
      <p><a href="${input.actionLink}">Reset Academy password</a></p>
      <p>If you did not request this change, contact Deebo Academy support.</p>
      <p>Deebo Academy</p>
    </div>`,
  };
}
