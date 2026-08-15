import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Handles both the Google OAuth redirect and the magic-link redirect — both
// arrive here as a PKCE `code` to exchange for a session cookie.
export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/plants";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
