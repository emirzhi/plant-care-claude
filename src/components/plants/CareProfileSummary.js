import { FiSun, FiDroplet, FiThermometer, FiAlertTriangle } from "react-icons/fi";

function Stat({ icon: Icon, label, detail }) {
  return (
    <div className="rounded-xl bg-surface-muted p-3">
      <Icon size={16} className="text-ink-muted" />
      <p className="mt-1.5 text-sm font-medium capitalize text-ink">{label}</p>
      {detail && <p className="mt-0.5 text-xs leading-snug text-ink-muted">{detail}</p>}
    </div>
  );
}

export default function CareProfileSummary({ careProfile }) {
  const [minC, maxC] = careProfile.temperature_range_c ?? [];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2.5">
        <Stat icon={FiSun} label={careProfile.light?.level} />
        <Stat icon={FiDroplet} label={`${careProfile.humidity?.level} humidity`} />
        <Stat icon={FiThermometer} label={`${minC}–${maxC}°C`} />
      </div>

      {careProfile.light?.notes && (
        <p className="text-xs leading-relaxed text-ink-muted">
          {careProfile.light.notes}
        </p>
      )}

      {careProfile.toxicity?.pets && (
        <div className="flex items-start gap-2.5 rounded-xl bg-warn-soft px-3.5 py-3 text-warn-soft-ink">
          <FiAlertTriangle className="mt-0.5 shrink-0" size={16} />
          <div>
            <p className="text-sm font-medium">Toxic to pets</p>
            {careProfile.toxicity.notes && (
              <p className="mt-0.5 text-xs leading-snug">{careProfile.toxicity.notes}</p>
            )}
          </div>
        </div>
      )}

      {careProfile.common_problems?.length > 0 && (
        <details className="card group px-4 py-3">
          <summary className="cursor-pointer list-none text-sm font-medium text-ink marker:hidden">
            Common problems
            <span className="float-right text-ink-faint transition group-open:rotate-90">
              ›
            </span>
          </summary>
          <ul className="mt-3 space-y-2.5 border-t border-line pt-3">
            {careProfile.common_problems.map((p, i) => (
              <li key={i} className="text-xs leading-relaxed text-ink-muted">
                <span className="font-medium text-ink">{p.symptom}</span> — {p.cause}.{" "}
                {p.fix}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
