import { FiSun, FiDroplet, FiThermometer, FiAlertTriangle } from "react-icons/fi";

export default function CareProfileSummary({ careProfile }) {
  const [minC, maxC] = careProfile.temperature_range_c ?? [];

  return (
    <div className="space-y-4 rounded-lg bg-neutral-50 p-4 text-sm">
      <div className="grid grid-cols-3 gap-3">
        <div className="flex items-start gap-2">
          <FiSun className="mt-0.5 shrink-0 text-amber-500" size={16} />
          <div>
            <p className="font-medium capitalize">{careProfile.light?.level}</p>
            <p className="text-xs text-neutral-500">{careProfile.light?.notes}</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <FiDroplet className="mt-0.5 shrink-0 text-blue-500" size={16} />
          <div>
            <p className="font-medium capitalize">{careProfile.humidity?.level} humidity</p>
            <p className="text-xs text-neutral-500">{careProfile.humidity?.notes}</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <FiThermometer className="mt-0.5 shrink-0 text-red-500" size={16} />
          <div>
            <p className="font-medium">
              {minC}&ndash;{maxC}&deg;C
            </p>
          </div>
        </div>
      </div>

      {careProfile.toxicity?.pets && (
        <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-2 text-amber-800">
          <FiAlertTriangle className="mt-0.5 shrink-0" size={16} />
          <div>
            <p className="font-medium">Toxic to pets</p>
            {careProfile.toxicity.notes && (
              <p className="text-xs">{careProfile.toxicity.notes}</p>
            )}
          </div>
        </div>
      )}

      {careProfile.common_problems?.length > 0 && (
        <div>
          <p className="mb-1 font-medium">Common problems</p>
          <ul className="space-y-1 text-xs text-neutral-600">
            {careProfile.common_problems.map((p, i) => (
              <li key={i}>
                <span className="font-medium text-neutral-800">{p.symptom}</span> —{" "}
                {p.cause}. {p.fix}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
