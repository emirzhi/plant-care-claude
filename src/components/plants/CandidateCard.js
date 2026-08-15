import { PLANT_TYPE_LABELS } from "@/lib/constants/plant-types";

export default function CandidateCard({ candidate, label, onSelect, disabled }) {
  const confidencePct = Math.round((candidate.confidence ?? 0) * 100);

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className="w-full rounded-lg border border-neutral-200 p-4 text-left transition hover:border-neutral-400 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <div className="flex items-center justify-between">
        {label && (
          <span className="text-xs font-medium uppercase tracking-wide text-green-700">
            {label}
          </span>
        )}
        <span className="text-xs text-neutral-500">{confidencePct}% confidence</span>
      </div>
      <p className="mt-1 font-medium text-neutral-900">
        {candidate.common_name || "Unknown"}
      </p>
      {candidate.scientific_name && (
        <p className="text-sm italic text-neutral-500">{candidate.scientific_name}</p>
      )}
      <span className="mt-2 inline-block rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">
        {PLANT_TYPE_LABELS[candidate.type]}
      </span>
    </button>
  );
}
