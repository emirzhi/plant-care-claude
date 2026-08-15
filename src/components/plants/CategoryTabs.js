import Link from "next/link";
import { PLANT_TYPES, PLANT_TYPE_LABELS } from "@/lib/constants/plant-types";

export default function CategoryTabs({ activeType, counts }) {
  const total = Object.values(counts).reduce((sum, n) => sum + n, 0);

  const tabs = [
    { type: null, label: "All", count: total },
    ...PLANT_TYPES.map((type) => ({
      type,
      label: PLANT_TYPE_LABELS[type],
      count: counts[type] ?? 0,
    })),
  ];

  return (
    <div className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
      {tabs.map(({ type, label, count }) => {
        const isActive = activeType === type;
        const href = type ? `/plants?type=${type}` : "/plants";
        return (
          <Link
            key={label}
            href={href}
            className={`shrink-0 rounded-full px-3 py-1.5 text-sm whitespace-nowrap transition ${
              isActive
                ? "bg-neutral-900 text-white"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }`}
          >
            {label}
            {count > 0 && (
              <span
                className={`ml-1.5 ${isActive ? "text-neutral-300" : "text-neutral-400"}`}
              >
                {count}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
