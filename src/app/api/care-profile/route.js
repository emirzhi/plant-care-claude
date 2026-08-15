import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateCareProfile } from "@/lib/plants/speciesCache";
import { isPlantType } from "@/lib/constants/plant-types";

export async function POST(request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const body = await request.json();
  const scientificName = body.scientificName?.toString().trim();
  const commonName = body.commonName?.toString().trim() || null;
  const plantType = body.plantType?.toString();

  if (!scientificName) {
    return NextResponse.json({ error: "scientificName is required." }, { status: 400 });
  }
  if (!isPlantType(plantType)) {
    return NextResponse.json({ error: "Invalid plantType." }, { status: 400 });
  }

  try {
    const speciesCareProfile = await getOrCreateCareProfile(supabase, {
      scientificName,
      commonName,
      plantType,
    });
    return NextResponse.json({ speciesCareProfile });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 502 });
  }
}
