import { getSupabaseServiceClient } from "@/lib/supabase/service";

export function getSupabaseAdminClient() {
  // Keep the original helper name in place while the repo migrates to the shared service client path.
  return getSupabaseServiceClient();
}
