import Link from "next/link";
import { notFound } from "next/navigation";
import { FiEdit2 } from "react-icons/fi";
import { GiPlantRoots } from "react-icons/gi";
import { createClient } from "@/lib/supabase/server";
import { getPlantById } from "@/lib/plants/queries";
import { getCareTasksForPlant } from "@/lib/care-tasks/queries";
import { PLANT_TYPE_LABELS } from "@/lib/constants/plant-types";
import DeletePlantButton from "@/components/plants/DeletePlantButton";
import CareTaskList from "@/components/care-tasks/CareTaskList";

export default async function PlantDetailPage({ params }) {
  const { id } = await params;
  const supabase = await createClient();
  const plant = await getPlantById(supabase, id);

  if (!plant) notFound();

  const tasks = await getCareTasksForPlant(supabase, plant.id);

  return (
    <div className="mx-auto max-w-lg">
      <div className="flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-neutral-100">
        {plant.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={plant.photo_url}
            alt={plant.nickname}
            className="h-full w-full object-cover"
          />
        ) : (
          <GiPlantRoots size={64} className="text-neutral-300" />
        )}
      </div>

      <div className="mt-4 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold">{plant.nickname}</h1>
          <p className="text-sm text-neutral-500">
            {plant.common_name || PLANT_TYPE_LABELS[plant.plant_type]}
            {plant.scientific_name && (
              <span className="italic"> &middot; {plant.scientific_name}</span>
            )}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-600">
          {PLANT_TYPE_LABELS[plant.plant_type]}
        </span>
      </div>

      {plant.notes && (
        <p className="mt-4 whitespace-pre-wrap text-sm text-neutral-700">
          {plant.notes}
        </p>
      )}

      <div className="mt-6 flex gap-2">
        <Link
          href={`/plants/${plant.id}/edit`}
          className="flex items-center gap-1.5 rounded-md border border-neutral-300 px-3 py-1.5 text-sm transition hover:bg-neutral-50"
        >
          <FiEdit2 size={15} />
          Edit
        </Link>
        <DeletePlantButton plantId={plant.id} />
      </div>

      <div className="mt-8">
        <CareTaskList plantId={plant.id} tasks={tasks} />
      </div>
    </div>
  );
}
