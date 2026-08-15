import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPlantById } from "@/lib/plants/queries";
import PlantForm from "@/components/plants/PlantForm";
import { updatePlantAction } from "@/lib/plants/actions";

export default async function EditPlantPage({ params }) {
  const { id } = await params;
  const supabase = await createClient();
  const plant = await getPlantById(supabase, id);

  if (!plant) notFound();

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-xl font-semibold">Edit {plant.nickname}</h1>
      <div className="mt-6">
        <PlantForm action={updatePlantAction} plant={plant} submitLabel="Save changes" />
      </div>
    </div>
  );
}
