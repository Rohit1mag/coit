import { createClient } from "@supabase/supabase-js";
import { getServiceRoleKey, getSupabasePublicEnv } from "@/lib/env";

export function createAdminClient() {
  const { url } = getSupabasePublicEnv();
  return createClient(url, getServiceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
