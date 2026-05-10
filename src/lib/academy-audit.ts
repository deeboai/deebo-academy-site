import "server-only";

import { getSupabaseServiceClient } from "@/lib/supabase/service";

export type AcademyAuditActor = {
  id: string;
  email?: string | null;
};

export async function insertAcademyAuditEvent(input: {
  actor: AcademyAuditActor;
  action: string;
  targetType: string;
  targetId?: string | null;
  targetEmail?: string | null;
  details?: Record<string, unknown>;
}) {
  const supabase = getSupabaseServiceClient() as any;

  // Audit inserts must fail loudly so operational history cannot drift silently.
  const { error } = await supabase.from("academy_audit_events").insert({
    actor_user_id: input.actor.id,
    actor_email: input.actor.email ?? null,
    action: input.action,
    target_type: input.targetType,
    target_id: input.targetId ?? null,
    target_email: input.targetEmail ?? null,
    details: input.details ?? {},
  });

  if (error) {
    throw error;
  }
}
