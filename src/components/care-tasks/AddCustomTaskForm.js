"use client";

import { useActionState, useEffect, useRef } from "react";
import { FiPlus } from "react-icons/fi";
import { addCustomTaskAction } from "@/lib/care-tasks/actions";

const initialState = { error: null, success: false };

export default function AddCustomTaskForm({ plantId }) {
  const [state, formAction, pending] = useActionState(addCustomTaskAction, initialState);
  const formRef = useRef(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-wrap items-end gap-2 pt-2">
      <input type="hidden" name="plant_id" value={plantId} />
      <div className="flex-1 min-w-[10rem]">
        <label htmlFor="display_name" className="mb-1 block text-xs font-medium text-neutral-600">
          Custom task name
        </label>
        <input
          id="display_name"
          name="display_name"
          required
          placeholder="e.g. Wipe leaves"
          className="w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm outline-none focus:border-neutral-500"
        />
      </div>
      <div>
        <label htmlFor="interval_days" className="mb-1 block text-xs font-medium text-neutral-600">
          Every (days)
        </label>
        <input
          id="interval_days"
          name="interval_days"
          type="number"
          min={1}
          defaultValue={14}
          required
          className="w-20 rounded-md border border-neutral-300 px-2 py-1.5 text-center text-sm outline-none focus:border-neutral-500"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="flex items-center gap-1.5 rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:opacity-50"
      >
        <FiPlus size={15} />
        {pending ? "Adding..." : "Add task"}
      </button>

      {state.error && <p className="w-full text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
