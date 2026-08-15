export async function getCareTasksForPlant(supabase, plantId) {
  const { data, error } = await supabase
    .from("care_tasks")
    .select(
      "id, plant_id, task_type, display_name, interval_days, next_due_at, last_completed_at, is_paused, created_at",
    )
    .eq("plant_id", plantId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}
