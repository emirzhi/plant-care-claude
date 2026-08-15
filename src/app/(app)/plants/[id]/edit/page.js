import Link from "next/link";
import { notFound } from "next/navigation";
import { FiArrowLeft } from "react-icons/fi";
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
    <div className="space-y-5">
      <Link
        href={`/plants/${plant.id}`}
        className="inline-flex items-center gap-1.5 text-sm text-ink-muted transition hover:text-ink"
      >
        <FiArrowLeft size={15} />
        Back
      </Link>

      <h1 className="text-2xl font-semibold tracking-tight text-ink">
        Edit {plant.nickname}
      </h1>

      <PlantForm
        action={updatePlantAction}
        plant={plant}
        submitLabel="Save changes"
      />
    </div>
  );
}
