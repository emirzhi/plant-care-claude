import Link from "next/link";
import { FiPlus } from "react-icons/fi";
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

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Your plants</h1>
        <Link
          href="/plants/new"
          className="flex items-center gap-1.5 rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-neutral-800"
        >
          <FiPlus size={16} />
          Add plant
        </Link>
      </div>

      <div className="mt-4">
        <CategoryTabs activeType={activeType} counts={counts} />
      </div>

      {plants.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-neutral-300 px-4 py-12 text-center text-sm text-neutral-500">
          {activeType
            ? "No plants in this category yet."
            : "No plants yet — add your first one."}
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {plants.map((plant) => (
            <PlantCard key={plant.id} plant={plant} />
          ))}
        </div>
      )}
    </div>
  );
}
