// Returns the current local hour (0-23) in the given IANA timezone.
// Returns null for an unrecognized timezone rather than throwing, so one bad
// profile row can't abort the whole cron run.
export function localHourInTimezone(timezone, now = new Date()) {
  try {
    const hour = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "numeric",
      hour12: false,
    }).format(now);
    const parsed = Number(hour);
    // hour12:false can render midnight as "24" in some ICU versions.
    return parsed === 24 ? 0 : parsed;
  } catch {
    return null;
  }
}

// Returns the current local date in the given IANA timezone as YYYY-MM-DD
// (matching a Postgres `date`). Null for an unrecognized timezone.
export function localDateInTimezone(timezone, now = new Date()) {
  try {
    // en-CA renders as YYYY-MM-DD.
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);
  } catch {
    return null;
  }
}

export function buildDigestPayload(overdueTasks) {
  const count = overdueTasks.length;
  const plantNames = [...new Set(overdueTasks.map((t) => t.plants?.nickname).filter(Boolean))];

  const body =
    count === 1
      ? `${overdueTasks[0].display_name} for ${overdueTasks[0].plants?.nickname ?? "a plant"}`
      : `${count} tasks across ${plantNames.length} plant${plantNames.length === 1 ? "" : "s"}: ${plantNames.slice(0, 3).join(", ")}${plantNames.length > 3 ? "…" : ""}`;

  return {
    title: count === 1 ? "1 plant needs attention" : `${count} plant tasks are due`,
    body,
    tag: "plant-care-digest",
    url: "/plants",
  };
}
