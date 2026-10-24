import "server-only";
import { createClient } from "@supabase/supabase-js";

let adminClient: ReturnType<typeof createClient> | null = null;

/**
 * Server-only administrative client. Import only from route handlers/server modules.
 * SUPABASE_SERVICE_ROLE_KEY must never use a NEXT_PUBLIC_ prefix or enter client bundles.
 */
export function getSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  if (!adminClient) {
    adminClient = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { headers: { "X-Client-Info": "vedic-ai-server-admin" } },
    });
  }
  return adminClient;
}
