import { FiChevronRight } from "react-icons/fi";
import { PLANT_TYPE_LABELS } from "@/lib/constants/plant-types";

export default function CandidateCard({ candidate, label, onSelect, disabled }) {
  const confidencePct = Math.round((candidate.confidence ?? 0) * 100);

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={`card group w-full p-4 text-left transition hover:border-line-strong hover:shadow-sm disabled:opacity-55 ${
        label ? "ring-1 ring-brand/25" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {label && (
            <span className="mb-1.5 inline-block rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-brand-soft-ink">
              {label}
            </span>
          )}
          <p className="truncate font-semibold text-ink">
            {candidate.common_name || "Unknown"}
          </p>
          {candidate.scientific_name && (
            <p className="truncate text-sm italic text-ink-muted">
              {candidate.scientific_name}
            </p>
          )}
          <span className="pill mt-2 bg-surface-muted text-ink-muted">
            {PLANT_TYPE_LABELS[candidate.type]}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div className="text-right">
            <p className="text-sm font-semibold text-ink">{confidencePct}%</p>
            <p className="text-[11px] text-ink-faint">match</p>
          </div>
          <FiChevronRight
            size={18}
            className="text-ink-faint transition group-hover:translate-x-0.5 group-hover:text-ink"
          />
        </div>
      </div>

      <div className="mt-3 h-1 overflow-hidden rounded-full bg-surface-muted">
        <div
          className="h-full rounded-full bg-brand transition-all"
          style={{ width: `${confidencePct}%` }}
        />
      </div>
    </button>
  );
}
