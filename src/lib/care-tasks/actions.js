"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { mutateOrThrow } from "@/lib/supabase/mutate";

async function requireUser(supabase) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");
  return user;
}

// Feature spec: "mark done rolls next_due_at forward by interval_days" — a
// fixed-schedule roll-forward from the task's *existing* next_due_at, not
// from now(). If a task was very overdue, marking it done advances the
// schedule by exactly one interval rather than snapping to "next occurrence
// after today" — matches the literal spec; revisit if that's not the
// intended behavior.
export async function markTaskDoneAction(taskId, plantId) {
  const supabase = await createClient();
  await requireUser(supabase);

  const { data: task, error } = await supabase
    .from("care_tasks")
    .select("interval_days, next_due_at")
    .eq("id", taskId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!task) throw new Error("Task not found.");

  const newNextDueAt = new Date(
    new Date(task.next_due_at).getTime() + task.interval_days * 24 * 60 * 60 * 1000,
  ).toISOString();

  await mutateOrThrow(
    supabase
      .from("care_tasks")
      .update({ next_due_at: newNextDueAt, last_completed_at: new Date().toISOString() })
      .eq("id", taskId),
  );

  revalidatePath(`/plants/${plantId}`);
}

export async function updateTaskIntervalAction(taskId, plantId, intervalDays) {
  const supabase = await createClient();
  await requireUser(supabase);

  if (!Number.isInteger(intervalDays) || intervalDays <= 0) {
    throw new Error("Interval must be a positive whole number of days.");
  }

  await mutateOrThrow(
    supabase.from("care_tasks").update({ interval_days: intervalDays }).eq("id", taskId),
  );

  revalidatePath(`/plants/${plantId}`);
}

export async function toggleTaskPauseAction(taskId, plantId, isPaused) {
  const supabase = await createClient();
  await requireUser(supabase);

  await mutateOrThrow(
    supabase.from("care_tasks").update({ is_paused: isPaused }).eq("id", taskId),
  );

  revalidatePath(`/plants/${plantId}`);
}

export async function addCustomTaskAction(_prevState, formData) {
  const supabase = await createClient();
  const plantId = formData.get("plant_id")?.toString();
  const displayName = formData.get("display_name")?.toString().trim();
  const intervalDays = Number(formData.get("interval_days"));

  try {
    const user = await requireUser(supabase);
    if (!plantId) throw new Error("Missing plant id.");
    if (!displayName) throw new Error("Task name is required.");
    if (!Number.isInteger(intervalDays) || intervalDays <= 0) {
      throw new Error("Interval must be a positive whole number of days.");
    }

    await mutateOrThrow(
      supabase.from("care_tasks").insert({
        plant_id: plantId,
        user_id: user.id,
        task_type: "custom",
        display_name: displayName,
        interval_days: intervalDays,
        next_due_at: new Date(Date.now() + intervalDays * 24 * 60 * 60 * 1000).toISOString(),
        is_paused: false,
      }),
    );
  } catch (err) {
    return { error: err.message };
  }

  revalidatePath(`/plants/${plantId}`);
  return { error: null, success: true };
}
