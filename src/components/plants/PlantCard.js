import Link from "next/link";
import { PiPlantFill } from "react-icons/pi";
import { PLANT_TYPE_LABELS } from "@/lib/constants/plant-types";

export default function PlantCard({ plant }) {
  const hasOverdue = plant.overdue_count > 0;

  return (
    <Link
      href={`/plants/${plant.id}`}
      className="group card overflow-hidden transition hover:border-line-strong hover:shadow-md"
    >
      <div className="relative aspect-square bg-surface-muted">
        {plant.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={plant.photo_url}
            alt={plant.nickname}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <PiPlantFill size={36} className="text-ink-faint/50" />
          </div>
        )}

        {hasOverdue && (
          <span className="absolute right-2 top-2 rounded-full bg-danger px-2 py-0.5 text-[11px] font-semibold text-white shadow-sm">
            {plant.overdue_count} due
          </span>
        )}
      </div>

      <div className="p-3">
        <p className="truncate text-sm font-semibold text-ink">{plant.nickname}</p>
        <p className="truncate text-xs text-ink-muted">
          {plant.common_name || PLANT_TYPE_LABELS[plant.plant_type]}
        </p>
      </div>
    </Link>
  );
}
