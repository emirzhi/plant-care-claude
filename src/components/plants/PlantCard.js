import Link from "next/link";
import { GiPlantRoots } from "react-icons/gi";
import { PLANT_TYPE_LABELS } from "@/lib/constants/plant-types";

export default function PlantCard({ plant }) {
  return (
    <Link
      href={`/plants/${plant.id}`}
      className="group block overflow-hidden rounded-lg border border-neutral-200 transition hover:border-neutral-300 hover:shadow-sm"
    >
      <div className="flex aspect-square items-center justify-center bg-neutral-100">
        {plant.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={plant.photo_url}
            alt={plant.nickname}
            className="h-full w-full object-cover"
          />
        ) : (
          <GiPlantRoots size={40} className="text-neutral-300" />
        )}
      </div>
      <div className="p-3">
        <p className="truncate font-medium text-neutral-900">
          {plant.nickname}
        </p>
        <p className="truncate text-xs text-neutral-500">
          {plant.common_name || PLANT_TYPE_LABELS[plant.plant_type]}
        </p>
      </div>
    </Link>
  );
}
