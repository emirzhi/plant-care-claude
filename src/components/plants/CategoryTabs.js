import Link from "next/link";
import { PLANT_TYPES, PLANT_TYPE_LABELS } from "@/lib/constants/plant-types";

export default function CategoryTabs({ activeType, counts }) {
  const total = Object.values(counts).reduce((sum, n) => sum + n, 0);

  // Only surface categories the user actually owns — an 11-tab rail with ten
  // zeroes is noise. The active category is always kept, so filtering to a
  // category and then deleting its last plant doesn't hide the active tab.
  const tabs = [
    { type: null, label: "All", count: total },
    ...PLANT_TYPES.filter(
      (type) => counts[type] > 0 || type === activeType,
    ).map((type) => ({
      type,
      label: PLANT_TYPE_LABELS[type],
      count: counts[type] ?? 0,
    })),
  ];

  if (tabs.length <= 1) return null;

  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {tabs.map(({ type, label, count }) => {
        const isActive = activeType === type;
        return (
          <Link
            key={label}
            href={type ? `/plants?type=${type}` : "/plants"}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium whitespace-nowrap transition ${
              isActive
                ? "bg-brand text-brand-ink"
                : "bg-surface-muted text-ink-muted hover:text-ink"
            }`}
          >
            {label}
            <span className={isActive ? "ml-1.5 opacity-70" : "ml-1.5 text-ink-faint"}>
              {count}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
