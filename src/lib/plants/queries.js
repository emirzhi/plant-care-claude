const PHOTO_BUCKET = "plant-photos";
const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1 hour — regenerated on every page load

// Attaches a `photo_url` (signed, or null) to each plant. Batches all photo
// paths into a single createSignedUrls() call instead of one request per plant.
async function withSignedPhotoUrls(supabase, plants) {
  const paths = plants.map((p) => p.photo_path).filter(Boolean);
  if (paths.length === 0) {
    return plants.map((p) => ({ ...p, photo_url: null }));
  }

  const { data: signed, error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .createSignedUrls(paths, SIGNED_URL_TTL_SECONDS);

  if (error) {
    // Missing/broken photos shouldn't take down the whole list page.
    return plants.map((p) => ({ ...p, photo_url: null }));
  }

  const urlByPath = new Map(signed.map((s) => [s.path, s.signedUrl]));
  return plants.map((p) => ({
    ...p,
    photo_url: p.photo_path ? (urlByPath.get(p.photo_path) ?? null) : null,
  }));
}

export async function getPlantsForUser(supabase, { plantType } = {}) {
  let query = supabase
    .from("plants")
    .select(
      "id, nickname, plant_type, scientific_name, common_name, photo_path, created_at",
    )
    .order("created_at", { ascending: false });

  if (plantType) {
    query = query.eq("plant_type", plantType);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return withSignedPhotoUrls(supabase, data ?? []);
}

// Counts per plant_type for the current user, used to render tab badges.
export async function getPlantTypeCounts(supabase) {
  const { data, error } = await supabase.from("plants").select("plant_type");
  if (error) throw new Error(error.message);

  const counts = {};
  for (const row of data ?? []) {
    counts[row.plant_type] = (counts[row.plant_type] ?? 0) + 1;
  }
  return counts;
}

export async function getPlantById(supabase, id) {
  const { data, error } = await supabase
    .from("plants")
    .select(
      "id, nickname, plant_type, scientific_name, common_name, photo_path, notes, identification_confidence, created_at, updated_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  const [withUrl] = await withSignedPhotoUrls(supabase, [data]);
  return withUrl;
}
