import { defaultDisplayNameForTaskType } from "@/lib/constants/care-task-types";

// Derives the default editable task list from a Claude-generated care
// profile. The profile has *seasonal* intervals (summer/winter,
// growing-season/dormant); care_tasks only has one interval_days each, so
// this picks the summer/growing-season value as the starting point — see
// "Seeding care_tasks from a generated care profile" in CLAUDE.md.
export function deriveTasksFromCareProfile(careProfile) {
  const tasks = [];

  if (Number.isInteger(careProfile?.watering?.interval_days_summer)) {
    tasks.push({
      task_type: "watering",
      display_name: defaultDisplayNameForTaskType("watering"),
      interval_days: careProfile.watering.interval_days_summer,
      is_paused: false,
    });
  }

  if (Number.isInteger(careProfile?.fertilizing?.interval_days_growing_season)) {
    tasks.push({
      task_type: "fertilizing",
      display_name: defaultDisplayNameForTaskType("fertilizing"),
      interval_days: careProfile.fertilizing.interval_days_growing_season,
      is_paused: false,
    });
  }

  if (Number.isInteger(careProfile?.mist?.interval_days)) {
    tasks.push({
      task_type: "misting",
      display_name: defaultDisplayNameForTaskType("misting"),
      interval_days: careProfile.mist.interval_days,
      is_paused: false,
    });
  }

  if (careProfile?.rotation_days > 0) {
    tasks.push({
      task_type: "rotating",
      display_name: defaultDisplayNameForTaskType("rotating"),
      interval_days: careProfile.rotation_days,
      is_paused: false,
    });
  }

  return tasks;
}
