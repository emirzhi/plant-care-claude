import { generateCareProfile } from "@/lib/anthropic/careProfile";

export function normalizeScientificName(scientificName) {
  return scientificName.trim().toLowerCase();
}

// Returns the cached species_care_profiles row for this species, generating
// (and caching) one via Claude if it doesn't exist yet — so the same species
// is never regenerated across users.
export async function getOrCreateCareProfile(
  supabase,
  { scientificName, commonName, plantType },
) {
  const key = normalizeScientificName(scientificName);

  const { data: existing, error: lookupError } = await supabase
    .from("species_care_profiles")
    .select("id, scientific_name, common_name, plant_type, care_profile")
    .eq("scientific_name_key", key)
    .maybeSingle();

  if (lookupError) throw new Error(lookupError.message);
  if (existing) return existing;

  const careProfile = await generateCareProfile({ scientificName, commonName });

  const { data: inserted, error: insertError } = await supabase
    .from("species_care_profiles")
    .insert({
      scientific_name_key: key,
      scientific_name: scientificName,
      common_name: commonName || null,
      plant_type: plantType,
      care_profile: careProfile,
    })
    .select();

  if (insertError) {
    // Another concurrent request cached the same species first (unique
    // violation on scientific_name_key) — reuse its row instead of failing.
    if (insertError.code === "23505") {
      const { data: raceWinner, error: refetchError } = await supabase
        .from("species_care_profiles")
        .select("id, scientific_name, common_name, plant_type, care_profile")
        .eq("scientific_name_key", key)
        .single();
      if (refetchError) throw new Error(refetchError.message);
      return raceWinner;
    }
    throw new Error(insertError.message);
  }
  if (!inserted || inserted.length === 0) {
    throw new Error(
      "Write affected zero rows — the row may not exist, or Row Level Security denied it.",
    );
  }

  return inserted[0];
}
