// Single source of truth for the care task "type" enum — a closed set.
// This must stay in sync with the DB check constraint in
// supabase/migrations/20260815164228_init_schema.sql.
//
// IMPORTANT: task_type is the canonical, closed-set column. It is never a
// user-typed string. User-typed task names (including for "custom" tasks)
// live in the separate `display_name` column — see care_tasks table.
export const CARE_TASK_TYPES = [
  "watering",
  "fertilizing",
  "misting",
  "pruning",
  "rotating",
  "custom",
];

export const CARE_TASK_TYPE_LABELS = {
  watering: "Water",
  fertilizing: "Fertilize",
  misting: "Mist",
  pruning: "Prune",
  rotating: "Rotate",
  custom: "Custom",
};

// Task types whose display_name is always derived from CARE_TASK_TYPE_LABELS
// (never user-editable). "custom" is the only type with a free-text name.
export const NON_CUSTOM_TASK_TYPES = CARE_TASK_TYPES.filter(
  (t) => t !== "custom",
);

export function isCareTaskType(value) {
  return CARE_TASK_TYPES.includes(value);
}

export function defaultDisplayNameForTaskType(taskType) {
  return CARE_TASK_TYPE_LABELS[taskType] ?? taskType;
}
