"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { mutateOrThrow } from "@/lib/supabase/mutate";

export async function updateReminderSettingsAction(_prevState, formData) {
  const supabase = await createClient();

  const reminderHour = Number(formData.get("reminder_hour"));
  const timezone = formData.get("timezone")?.toString().trim();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not signed in.");

    if (!Number.isInteger(reminderHour) || reminderHour < 0 || reminderHour > 23) {
      throw new Error("Reminder hour must be between 0 and 23.");
    }
    if (!timezone) throw new Error("Timezone is required.");
    // Reject anything Intl doesn't recognize — the cron digest resolves each
    // user's local hour with this string, so a bad value would silently
    // exclude them from every digest.
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: timezone });
    } catch {
      throw new Error(`Unrecognized timezone: ${timezone}`);
    }

    await mutateOrThrow(
      supabase
        .from("profiles")
        .update({ reminder_hour: reminderHour, timezone })
        .eq("id", user.id),
    );
  } catch (err) {
    return { error: err.message };
  }

  revalidatePath("/settings");
  return { error: null, success: true };
}
