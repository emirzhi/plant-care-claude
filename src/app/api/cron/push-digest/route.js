import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendNotification } from "@/lib/push/webPush";
import {
  localHourInTimezone,
  localDateInTimezone,
  buildDigestPayload,
} from "@/lib/push/digest";

// Triggered hourly by .github/workflows/push-digest.yml (Vercel Hobby only
// allows *daily* crons, and per-timezone delivery needs an hourly tick).
// Each run sends the digest only to users whose *local* hour currently equals
// their reminder_hour, so everyone gets it at their chosen time regardless of
// timezone.
//
// Idempotent per local day via profiles.last_digest_sent_on, so a retried or
// overlapping trigger can't send the same user two digests.
//
// Uses the service-role client: it deliberately reads across all users, which
// RLS would (correctly) forbid for a normal session.
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function isAuthorized(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const supabase = createAdminClient();
  const now = new Date();

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, timezone, reminder_hour, last_digest_sent_on");
  if (profilesError) {
    return NextResponse.json({ error: profilesError.message }, { status: 500 });
  }

  const dueUsers = (profiles ?? []).filter((p) => {
    if (localHourInTimezone(p.timezone, now) !== p.reminder_hour) return false;
    // Already sent during this user's local day.
    const localDate = localDateInTimezone(p.timezone, now);
    return localDate !== null && p.last_digest_sent_on !== localDate;
  });

  let notified = 0;
  let skipped = 0;
  let pruned = 0;

  for (const profile of dueUsers) {
    const { data: overdueTasks, error: tasksError } = await supabase
      .from("care_tasks")
      .select("id, display_name, next_due_at, plants(nickname)")
      .eq("user_id", profile.id)
      .eq("is_paused", false)
      .lte("next_due_at", now.toISOString());

    if (tasksError || !overdueTasks || overdueTasks.length === 0) {
      skipped += 1;
      continue;
    }

    const { data: subscriptions } = await supabase
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .eq("user_id", profile.id);

    if (!subscriptions || subscriptions.length === 0) {
      skipped += 1;
      continue;
    }

    const payload = buildDigestPayload(overdueTasks);
    let deliveredToAnyDevice = false;

    for (const subscription of subscriptions) {
      const result = await sendNotification(subscription, payload);
      if (result.ok) {
        notified += 1;
        deliveredToAnyDevice = true;
      } else if (result.gone) {
        // Push service says this endpoint is dead — drop it so it isn't
        // retried on every subsequent run.
        await supabase.from("push_subscriptions").delete().eq("id", subscription.id);
        pruned += 1;
      }
    }

    // Only mark the day as sent if something actually landed; a transient
    // push-service failure should be retried on the next hourly tick rather
    // than silently swallowing today's digest.
    if (deliveredToAnyDevice) {
      await supabase
        .from("profiles")
        .update({ last_digest_sent_on: localDateInTimezone(profile.timezone, now) })
        .eq("id", profile.id);
    }
  }

  return NextResponse.json({
    ok: true,
    checkedUsers: profiles?.length ?? 0,
    dueUsers: dueUsers.length,
    notified,
    skipped,
    pruned,
  });
}
