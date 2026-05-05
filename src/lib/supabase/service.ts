import "server-only";

import { createClient } from "@supabase/supabase-js";

import { assertPublicSupabaseEnv, assertServiceRoleKey, env } from "@/lib/env";

export function getSupabaseServiceClient() {
  assertPublicSupabaseEnv();
  assertServiceRoleKey();

  return createClient(env.publicSupabaseUrl, env.serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
