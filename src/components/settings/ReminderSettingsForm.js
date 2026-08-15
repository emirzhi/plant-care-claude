"use client";

import { useActionState, useEffect, useState } from "react";
import { FiCheck } from "react-icons/fi";
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
      <div className="card space-y-4 p-4">
        <div>
          <label
            htmlFor="reminder_hour"
            className="mb-1.5 block text-sm font-medium text-ink"
          >
            Send my digest at
          </label>
          <select
            id="reminder_hour"
            name="reminder_hour"
            defaultValue={profile.reminder_hour}
            className="field"
          >
            {HOURS.map((h) => (
              <option key={h} value={h}>
                {formatHour(h)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="timezone" className="mb-1.5 block text-sm font-medium text-ink">
            Timezone
          </label>
          <input
            id="timezone"
            name="timezone"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="field"
          />
          {detectedTz && detectedTz !== timezone && (
            <button
              type="button"
              onClick={() => setTimezone(detectedTz)}
              className="mt-2 text-xs font-medium text-brand underline underline-offset-2"
            >
              Use detected: {detectedTz}
            </button>
          )}
        </div>
      </div>

      {state.error && <p className="text-sm text-danger">{state.error}</p>}

      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "Saving..." : "Save"}
        </button>
        {state.success && !state.error && (
          <span className="flex items-center gap-1.5 text-sm text-brand">
            <FiCheck size={15} />
            Saved
          </span>
        )}
      </div>
    </form>
  );
}
