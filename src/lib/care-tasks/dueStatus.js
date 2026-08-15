const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Returns { label, tone } describing when a task is next due, for display
// only — doesn't affect scheduling. tone is one of "paused" | "overdue" |
// "soon" | "ok" (for styling hooks in the UI layer).
export function getDueStatus(task) {
  if (task.is_paused) {
    return { label: "Paused", tone: "paused" };
  }

  const diffDays = Math.round(
    (new Date(task.next_due_at).getTime() - Date.now()) / MS_PER_DAY,
  );

  if (diffDays < 0) {
    return {
      label: `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? "" : "s"}`,
      tone: "overdue",
    };
  }
  if (diffDays === 0) {
    return { label: "Due today", tone: "soon" };
  }
  if (diffDays === 1) {
    return { label: "Due tomorrow", tone: "soon" };
  }
  return { label: `Due in ${diffDays} days`, tone: "ok" };
}
