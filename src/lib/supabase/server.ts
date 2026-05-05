import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { assertPublicSupabaseEnv, env } from "@/lib/env";

export async function getSupabaseServerClient() {
  assertPublicSupabaseEnv();

  const cookieStore = await cookies();

  return createServerClient(env.publicSupabaseUrl, env.publicSupabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          try {
            // Server renders cannot always write cookies, so middleware remains responsible for refreshes between requests.
            cookieStore.set(name, value, options);
          } catch {
            // The read-only render path still needs to complete even when Next.js blocks cookie writes.
          }
        });
      },
    },
  });
}
