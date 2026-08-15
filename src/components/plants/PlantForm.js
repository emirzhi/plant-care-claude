"use client";

import { useActionState } from "react";
import { PLANT_TYPES, PLANT_TYPE_LABELS } from "@/lib/constants/plant-types";

const initialState = { error: null };

export default function PlantForm({ action, plant, submitLabel }) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-5">
      {plant?.id && <input type="hidden" name="id" value={plant.id} />}

      <div>
        <label htmlFor="nickname" className="mb-1 block text-sm font-medium">
          Nickname
        </label>
        <input
          id="nickname"
          name="nickname"
          required
          defaultValue={plant?.nickname ?? ""}
          placeholder="e.g. Steve"
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500"
        />
      </div>

      <div>
        <label htmlFor="plant_type" className="mb-1 block text-sm font-medium">
          Category
        </label>
        <select
          id="plant_type"
          name="plant_type"
          required
          defaultValue={plant?.plant_type ?? ""}
          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-500"
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
        <label htmlFor="photo" className="mb-1 block text-sm font-medium">
          Photo {plant?.photo_url ? "(replace)" : "(optional)"}
        </label>
        <input
          id="photo"
          name="photo"
          type="file"
          accept="image/*"
          className="w-full text-sm text-neutral-600 file:mr-3 file:rounded-md file:border-0 file:bg-neutral-100 file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-neutral-200"
        />
      </div>

      <div>
        <label htmlFor="notes" className="mb-1 block text-sm font-medium">
          Notes (optional)
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={plant?.notes ?? ""}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500"
        />
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:opacity-50"
      >
        {pending ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}
