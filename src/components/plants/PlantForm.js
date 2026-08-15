"use client";

import { useActionState } from "react";
import { PLANT_TYPES, PLANT_TYPE_LABELS } from "@/lib/constants/plant-types";

const initialState = { error: null };

export default function PlantForm({ action, plant, submitLabel }) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      {plant?.id && <input type="hidden" name="id" value={plant.id} />}

      <div className="card space-y-4 p-4">
        <div>
          <label htmlFor="nickname" className="mb-1.5 block text-sm font-medium text-ink">
            Name
          </label>
          <input
            id="nickname"
            name="nickname"
            required
            defaultValue={plant?.nickname ?? ""}
            placeholder="e.g. Steve"
            className="field"
          />
        </div>

        <div>
          <label
            htmlFor="plant_type"
            className="mb-1.5 block text-sm font-medium text-ink"
          >
            Category
          </label>
          <select
            id="plant_type"
            name="plant_type"
            required
            defaultValue={plant?.plant_type ?? ""}
            className="field"
          >
            <option value="" disabled>
              Select a category
            </option>
            {PLANT_TYPES.map((type) => (
              <option key={type} value={type}>
                {PLANT_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="photo" className="mb-1.5 block text-sm font-medium text-ink">
            Photo{" "}
            <span className="font-normal text-ink-faint">
              {plant?.photo_url ? "(replace)" : "(optional)"}
            </span>
          </label>
          <input
            id="photo"
            name="photo"
            type="file"
            accept="image/*"
            className="w-full text-sm text-ink-muted file:mr-3 file:rounded-lg file:border-0 file:bg-surface-muted file:px-3 file:py-2 file:text-sm file:font-medium file:text-ink hover:file:bg-line"
          />
        </div>

        <div>
          <label htmlFor="notes" className="mb-1.5 block text-sm font-medium text-ink">
            Notes <span className="font-normal text-ink-faint">(optional)</span>
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            defaultValue={plant?.notes ?? ""}
            className="field resize-none"
          />
        </div>
      </div>

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}

      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}
