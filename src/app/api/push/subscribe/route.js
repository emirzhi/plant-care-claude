import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const body = await request.json();
  const endpoint = body.endpoint?.toString();
  const p256dh = body.keys?.p256dh?.toString();
  const auth = body.keys?.auth?.toString();

  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ error: "Invalid subscription." }, { status: 400 });
  }

  // endpoint is UNIQUE — re-subscribing the same device (or a device that
  // changed hands) upserts rather than erroring.
  const { data, error } = await supabase
    .from("push_subscriptions")
    .upsert({ user_id: user.id, endpoint, p256dh, auth }, { onConflict: "endpoint" })
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data || data.length === 0) {
    return NextResponse.json(
      { error: "Subscription write affected zero rows (RLS)." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
