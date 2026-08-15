"use client";

import { useActionState, useEffect, useState } from "react";
import { updateReminderSettingsAction } from "@/lib/profile/actions";

const initialState = { error: null, success: false };

const HOURS = Array.from({ length: 24 }, (_, h) => h);

function formatHour(hour) {
  const suffix = hour < 12 ? "AM" : "PM";
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display}:00 ${suffix}`;
}

export default function ReminderSettingsForm({ profile }) {
  const [state, formAction, pending] = useActionState(
    updateReminderSettingsAction,
    initialState,
  );

  // Offer to fill in the timezone the browser actually reports, so the user
  // doesn't have to know their IANA name.
  const [detectedTz, setDetectedTz] = useState(null);
  const [timezone, setTimezone] = useState(profile.timezone);

  useEffect(() => {
    try {
      setDetectedTz(Intl.DateTimeFormat().resolvedOptions().timeZone);
    } catch {
      setDetectedTz(null);
    }
  }, []);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="reminder_hour" className="mb-1 block text-sm font-medium">
          Daily reminder time
        </label>
        <select
          id="reminder_hour"
          name="reminder_hour"
          defaultValue={profile.reminder_hour}
          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-500"
        >
          {HOURS.map((h) => (
            <option key={h} value={h}>
              {formatHour(h)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="timezone" className="mb-1 block text-sm font-medium">
          Timezone
        </label>
        <input
          id="timezone"
          name="timezone"
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500"
        />
        {detectedTz && detectedTz !== timezone && (
          <button
            type="button"
            onClick={() => setTimezone(detectedTz)}
            className="mt-1.5 text-xs text-neutral-600 underline"
          >
            Use detected timezone ({detectedTz})
          </button>
        )}
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.success && !state.error && (
        <p className="text-sm text-green-700">Saved.</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:opacity-50"
      >
        {pending ? "Saving..." : "Save"}
      </button>
    </form>
  );
}
