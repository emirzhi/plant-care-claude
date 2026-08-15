import Link from "next/link";
import { FiPlus } from "react-icons/fi";
import { PiPlantFill } from "react-icons/pi";
import { createClient } from "@/lib/supabase/server";
import { getPlantsForUser, getPlantTypeCounts } from "@/lib/plants/queries";
import { isPlantType } from "@/lib/constants/plant-types";
import CategoryTabs from "@/components/plants/CategoryTabs";
import PlantCard from "@/components/plants/PlantCard";

export default async function PlantsPage({ searchParams }) {
  const { type } = await searchParams;
  const activeType = isPlantType(type) ? type : null;

  const supabase = await createClient();
  const [plants, counts] = await Promise.all([
    getPlantsForUser(supabase, { plantType: activeType }),
    getPlantTypeCounts(supabase),
  ]);

  const overdueTotal = plants.reduce((sum, p) => sum + (p.overdue_count ?? 0), 0);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Your plants
          </h1>
          <p className="mt-0.5 text-sm text-ink-muted">
            {overdueTotal > 0
              ? `${overdueTotal} task${overdueTotal === 1 ? "" : "s"} need attention`
              : plants.length > 0
                ? "Everything's on schedule"
                : "Let's get your first plant in here"}
          </p>
        </div>
        <Link href="/plants/new" className="btn-primary shrink-0 !px-3.5">
          <FiPlus size={17} />
          <span className="hidden sm:inline">Add plant</span>
        </Link>
      </div>

      <CategoryTabs activeType={activeType} counts={counts} />

      {plants.length === 0 ? (
        <div className="card flex flex-col items-center px-6 py-14 text-center">
          <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft text-brand-soft-ink">
            <PiPlantFill size={26} />
          </span>
          <p className="font-medium text-ink">
            {activeType ? "Nothing in this category" : "No plants yet"}
          </p>
          <p className="mt-1 max-w-xs text-sm text-ink-muted">
            {activeType
              ? "Try another category, or add a new plant."
              : "Take a photo and we'll identify the species and build a care schedule for you."}
          </p>
          {!activeType && (
            <Link href="/plants/new" className="btn-primary mt-5">
              <FiPlus size={17} />
              Add your first plant
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
          {plants.map((plant) => (
            <PlantCard key={plant.id} plant={plant} />
          ))}
        </div>
      )}
    </div>
  );
}
