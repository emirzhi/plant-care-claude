// Enums used *inside* the care_profile jsonb blob (species_care_profiles.care_profile).
// These aren't their own DB columns, so there's no DB check constraint for them —
// but they must still agree between the Claude prompt (see anthropic.js), the
// response validator, and any UI that renders them. Defined once here.
export const LIGHT_LEVELS = ["bright indirect", "low", "direct"];

export const HUMIDITY_LEVELS = ["low", "medium", "high"];

export function isLightLevel(value) {
  return LIGHT_LEVELS.includes(value);
}

export function isHumidityLevel(value) {
  return HUMIDITY_LEVELS.includes(value);
}
