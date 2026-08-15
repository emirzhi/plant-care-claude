import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Privileged server-only client (service role / secret key — bypasses RLS).
// NEVER import this from client components or expose the key to the browser.
// Reserved for trusted server-side jobs (e.g. the push-digest cron route)
// that legitimately need to read/write across all users.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    },
  );
}
