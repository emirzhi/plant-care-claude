import Link from "next/link";
import { notFound } from "next/navigation";
import { FiEdit2, FiArrowLeft } from "react-icons/fi";
import { PiPlantFill } from "react-icons/pi";
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
    <div className="space-y-6">
      <Link
        href="/plants"
        className="inline-flex items-center gap-1.5 text-sm text-ink-muted transition hover:text-ink"
      >
        <FiArrowLeft size={15} />
        All plants
      </Link>

      <div className="card overflow-hidden">
        <div className="aspect-[4/3] bg-surface-muted">
          {plant.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={plant.photo_url}
              alt={plant.nickname}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <PiPlantFill size={48} className="text-ink-faint/50" />
            </div>
          )}
        </div>

        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="truncate text-xl font-semibold tracking-tight text-ink">
                {plant.nickname}
              </h1>
              <p className="mt-0.5 text-sm text-ink-muted">
                {plant.common_name}
                {plant.scientific_name && (
                  <span className="italic text-ink-faint">
                    {plant.common_name ? " · " : ""}
                    {plant.scientific_name}
                  </span>
                )}
              </p>
            </div>
            <span className="pill shrink-0 bg-brand-soft text-brand-soft-ink">
              {PLANT_TYPE_LABELS[plant.plant_type]}
            </span>
          </div>

          {plant.notes && (
            <p className="mt-4 whitespace-pre-wrap border-t border-line pt-4 text-sm text-ink-muted">
              {plant.notes}
            </p>
          )}

          <div className="mt-5 flex gap-2">
            <Link href={`/plants/${plant.id}/edit`} className="btn-secondary !py-2">
              <FiEdit2 size={15} />
              Edit
            </Link>
            <DeletePlantButton plantId={plant.id} />
          </div>
        </div>
      </div>

      <CareTaskList plantId={plant.id} tasks={tasks} />
    </div>
  );
}
