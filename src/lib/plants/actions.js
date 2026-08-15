"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { mutateOrThrow } from "@/lib/supabase/mutate";
import { isPlantType } from "@/lib/constants/plant-types";

const PHOTO_BUCKET = "plant-photos";

async function requireUser(supabase) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");
  return user;
}

function readPlantFields(formData) {
  const nickname = formData.get("nickname")?.toString().trim() ?? "";
  const plantType = formData.get("plant_type")?.toString() ?? "";
  const notes = formData.get("notes")?.toString().trim() || null;

  if (!nickname) throw new Error("Nickname is required.");
  if (!isPlantType(plantType)) throw new Error("Invalid plant type.");

  return { nickname, plant_type: plantType, notes };
}

async function uploadPhotoIfPresent(supabase, userId, plantId, formData) {
  const photo = formData.get("photo");
  if (!photo || typeof photo === "string" || photo.size === 0) return null;

  const safeName = photo.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${userId}/${plantId}/${Date.now()}-${safeName}`;

  const { error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(path, photo, { contentType: photo.type });
  if (error) throw new Error(`Photo upload failed: ${error.message}`);

  return path;
}

// Plant creation goes through the AI identify -> care profile wizard
// (src/components/plants/AddPlantWizard.js -> /api/identify, /api/care-profile,
// /api/plants) instead of a plain form/server action — nickname and category
// are derived from Claude's identification, not typed in upfront. This
// action only covers editing an already-created plant (e.g. to correct a
// misidentified category, rename, or replace the photo).
export async function updatePlantAction(_prevState, formData) {
  const supabase = await createClient();
  const plantId = formData.get("id")?.toString();
  if (!plantId) return { error: "Missing plant id." };

  try {
    const user = await requireUser(supabase);
    const fields = readPlantFields(formData);

    const photoPath = await uploadPhotoIfPresent(
      supabase,
      user.id,
      plantId,
      formData,
    );

    await mutateOrThrow(
      supabase
        .from("plants")
        .update({ ...fields, ...(photoPath ? { photo_path: photoPath } : {}) })
        .eq("id", plantId),
    );
  } catch (err) {
    return { error: err.message };
  }

  redirect(`/plants/${plantId}`);
}

export async function deletePlantAction(plantId) {
  const supabase = await createClient();
  await requireUser(supabase);

  const { data: plant } = await supabase
    .from("plants")
    .select("photo_path")
    .eq("id", plantId)
    .maybeSingle();

  await mutateOrThrow(supabase.from("plants").delete().eq("id", plantId));

  if (plant?.photo_path) {
    // Best-effort cleanup — a failed storage delete shouldn't block the
    // plant record (and its care_tasks, via ON DELETE CASCADE) from being gone.
    await supabase.storage.from(PHOTO_BUCKET).remove([plant.photo_path]);
  }

  redirect("/plants");
}
