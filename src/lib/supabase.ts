import { createClient } from "@supabase/supabase-js";

import { assertPublicSupabaseEnv, env } from "@/lib/env";

export function getSupabaseClient() {
  assertPublicSupabaseEnv();

  // The Academy intake table is publicly insertable through RLS, so the standalone site only needs the anon client.
  return createClient(env.publicSupabaseUrl, env.publicSupabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
