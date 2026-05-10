import "server-only";

import { assertAcademyEmailEnv, env, hasAcademyEmailEnv, hasServiceRoleKey } from "@/lib/env";
import { getSupabaseServiceClient } from "@/lib/supabase/service";

type ResendEmailPayload = {
  from: string;
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  reply_to?: string;
};

type EmailLogInput = {
  recipient: string;
  subject: string;
  template: string;
  relatedType?: string;
  relatedId?: string | null;
};

type EmailSendOptions = {
  log: EmailLogInput;
};

async function insertEmailLog(input: EmailLogInput & {
  status: string;
  providerMessageId?: string | null;
  errorMessage?: string | null;
  sentAt?: string | null;
}) {
  if (!hasServiceRoleKey) {
    return;
  }

  const supabase = getSupabaseServiceClient() as any;
  await supabase.from("academy_email_logs").insert({
    recipient: input.recipient,
    subject: input.subject,
    template: input.template,
    status: input.status,
    provider: "resend",
    provider_message_id: input.providerMessageId ?? null,
    error_message: input.errorMessage ?? null,
    related_type: input.relatedType ?? null,
    related_id: input.relatedId ?? null,
    sent_at: input.sentAt ?? null,
  });
}

export async function sendAcademyEmail(
  payload: ResendEmailPayload,
  options: EmailSendOptions,
) {
  if (!hasAcademyEmailEnv) {
    // Persist the skip so the admin email log explains why nothing was delivered.
    await insertEmailLog({
      ...options.log,
      status: "skipped",
      errorMessage: "Academy email environment is incomplete.",
    });
    return { sent: false as const };
  }

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
    await insertEmailLog({
      ...options.log,
      status: "failed",
      errorMessage: `Resend email request failed: ${response.status} ${responseText}`,
    });
    throw new Error(`Resend email request failed: ${response.status} ${responseText}`);
  }

  const responseJson = (await response.json()) as { id?: string };
  await insertEmailLog({
    ...options.log,
    status: "sent",
    providerMessageId: responseJson.id ?? null,
    sentAt: new Date().toISOString(),
  });

  return {
    sent: true as const,
    providerMessageId: responseJson.id ?? null,
  };
}
