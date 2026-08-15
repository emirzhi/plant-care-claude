import { createClient } from "@/lib/supabase/server";
import ReminderSettingsForm from "@/components/settings/ReminderSettingsForm";
import PushToggle from "@/components/settings/PushToggle";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, display_name, avatar_url, timezone, reminder_hour")
    .eq("id", user.id)
    .single();

  const initial = (profile?.display_name || profile?.email || "?")
    .charAt(0)
    .toUpperCase();

  return (
    <div className="space-y-7">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">Settings</h1>

      <div className="card flex items-center gap-3 p-4">
        {profile?.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatar_url}
            alt=""
            className="h-11 w-11 rounded-full object-cover"
          />
        ) : (
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-soft text-base font-semibold text-brand-soft-ink">
            {initial}
          </span>
        )}
        <div className="min-w-0">
          {profile?.display_name && (
            <p className="truncate text-sm font-medium text-ink">
              {profile.display_name}
            </p>
          )}
          <p className="truncate text-sm text-ink-muted">{profile?.email}</p>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-ink-faint">
          Notifications
        </h2>
        <PushToggle />
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-ink-faint">
          Daily digest
        </h2>
        <p className="text-sm text-ink-muted">
          One notification a day listing everything that&rsquo;s overdue, sent at
          this hour in your local time.
        </p>
        <ReminderSettingsForm profile={profile} />
      </section>
    </div>
  );
}
