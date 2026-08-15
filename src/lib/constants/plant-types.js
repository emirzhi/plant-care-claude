// Single source of truth for the plant "type"/category enum.
// UI filter tabs, the identify-species API route, and the DB check constraint
// (see supabase/migrations/20260815164228_init_schema.sql) must all agree with
// this list. If you add/remove/rename a value here, update the migration too.
//
// NOTE: "cacti" (not "cactus") is intentional — it matches the literal enum
// value used in the Claude identification prompt's JSON schema.
export const PLANT_TYPES = [
  "houseplant",
  "succulent",
  "cacti",
  "flowering",
  "tree",
  "shrub",
  "herb",
  "edible",
  "fern",
  "palm",
  "other",
];

export const PLANT_TYPE_LABELS = {
  houseplant: "Houseplant",
  succulent: "Succulent",
  cacti: "Cactus",
  flowering: "Flowering",
  tree: "Tree",
  shrub: "Shrub",
  herb: "Herb",
  edible: "Edible",
  fern: "Fern",
  palm: "Palm",
  other: "Other",
};

export function isPlantType(value) {
  return PLANT_TYPES.includes(value);
}
