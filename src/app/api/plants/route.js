import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { mutateOrThrow } from "@/lib/supabase/mutate";
import { isPlantType } from "@/lib/constants/plant-types";
import { isCareTaskType, defaultDisplayNameForTaskType } from "@/lib/constants/care-task-types";

export async function POST(request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const body = await request.json();
  const nickname = body.nickname?.toString().trim();
  const photoPath = body.photoPath?.toString() || null;
  const speciesCareProfileId = body.speciesCareProfileId?.toString();
  const candidate = body.candidate;
  const tasks = Array.isArray(body.tasks) ? body.tasks : [];

  if (!nickname) {
    return NextResponse.json({ error: "Nickname is required." }, { status: 400 });
  }
  if (!candidate || !isPlantType(candidate.type) || !candidate.scientific_name) {
    return NextResponse.json({ error: "Invalid identified species." }, { status: 400 });
  }
  if (!speciesCareProfileId) {
    return NextResponse.json({ error: "Missing speciesCareProfileId." }, { status: 400 });
  }

  const validTasks = tasks
    .filter((t) => isCareTaskType(t.task_type) && Number.isInteger(t.interval_days) && t.interval_days > 0)
    .map((t) => ({
      task_type: t.task_type,
      display_name: defaultDisplayNameForTaskType(t.task_type),
      interval_days: t.interval_days,
      is_paused: Boolean(t.is_paused),
    }));

  let plantId;
  try {
    const plantRows = await mutateOrThrow(
      supabase.from("plants").insert({
        user_id: user.id,
        species_care_profile_id: speciesCareProfileId,
        nickname,
        plant_type: candidate.type,
        scientific_name: candidate.scientific_name,
        common_name: candidate.common_name || null,
        photo_path: photoPath,
        identification_confidence: candidate.confidence ?? null,
      }),
    );
    plantId = plantRows[0].id;

    if (validTasks.length > 0) {
      const now = Date.now();
      await mutateOrThrow(
        supabase.from("care_tasks").insert(
          validTasks.map((t) => ({
            plant_id: plantId,
            user_id: user.id,
            task_type: t.task_type,
            display_name: t.display_name,
            interval_days: t.interval_days,
            is_paused: t.is_paused,
            next_due_at: new Date(now + t.interval_days * 24 * 60 * 60 * 1000).toISOString(),
          })),
        ),
      );
    }
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }

  return NextResponse.json({ plantId });
}
