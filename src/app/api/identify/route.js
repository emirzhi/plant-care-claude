import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { identifySpecies, isSupportedImageType } from "@/lib/anthropic/identify";

const PHOTO_BUCKET = "plant-photos";
const MAX_BYTES = 8 * 1024 * 1024; // 8MB

export async function POST(request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const formData = await request.formData();
  const photo = formData.get("photo");

  if (!photo || typeof photo === "string") {
    return NextResponse.json({ error: "No photo provided." }, { status: 400 });
  }
  if (!isSupportedImageType(photo.type)) {
    return NextResponse.json(
      { error: `Unsupported image type: ${photo.type}` },
      { status: 400 },
    );
  }
  if (photo.size > MAX_BYTES) {
    return NextResponse.json({ error: "Photo is too large (max 8MB)." }, { status: 400 });
  }

  const buffer = Buffer.from(await photo.arrayBuffer());
  const safeName = photo.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const photoPath = `${user.id}/uploads/${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(photoPath, buffer, { contentType: photo.type });
  if (uploadError) {
    return NextResponse.json(
      { error: `Photo upload failed: ${uploadError.message}` },
      { status: 500 },
    );
  }

  try {
    const result = await identifySpecies({
      base64: buffer.toString("base64"),
      mediaType: photo.type,
    });
    return NextResponse.json({ photoPath, ...result });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 502 });
  }
}
