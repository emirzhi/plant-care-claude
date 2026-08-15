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
    .select("email, display_name, timezone, reminder_hour")
    .eq("id", user.id)
    .single();

  return (
    <div className="mx-auto max-w-md space-y-8">
      <div>
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="mt-1 text-sm text-neutral-500">
          {profile?.display_name || profile?.email}
        </p>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Notifications
        </h2>
        <PushToggle />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Daily digest
        </h2>
        <p className="mb-3 text-sm text-neutral-500">
          You&rsquo;ll get one notification a day listing overdue tasks, sent at this
          hour in your local time.
        </p>
        <ReminderSettingsForm profile={profile} />
      </section>
    </div>
  );
}
