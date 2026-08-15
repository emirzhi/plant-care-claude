"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { FiPlus, FiX } from "react-icons/fi";
import { addCustomTaskAction } from "@/lib/care-tasks/actions";

const initialState = { error: null, success: false };

export default function AddCustomTaskForm({ plantId }) {
  const [state, formAction, pending] = useActionState(addCustomTaskAction, initialState);
  const [open, setOpen] = useState(false);
  const formRef = useRef(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      setOpen(false);
    }
  }, [state.success]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-1.5 rounded-2xl border border-dashed border-line py-3 text-sm font-medium text-ink-muted transition hover:border-line-strong hover:text-ink"
      >
        <FiPlus size={16} />
        Add a custom task
      </button>
    );
  }

  return (
    <form ref={formRef} action={formAction} className="card space-y-3 p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-ink">New task</p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Cancel"
          className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-faint transition hover:bg-surface-muted hover:text-ink"
        >
          <FiX size={16} />
        </button>
      </div>

      <input type="hidden" name="plant_id" value={plantId} />

      <div className="flex gap-2">
        <input
          name="display_name"
          required
          autoFocus
          placeholder="e.g. Wipe leaves"
          className="field flex-1"
        />
        <div className="flex items-center gap-1.5 text-sm text-ink-muted">
          <input
            name="interval_days"
            type="number"
            min={1}
            defaultValue={14}
            required
            aria-label="Interval in days"
            className="field w-16 !px-2 text-center"
          />
          days
        </div>
      </div>

      {state.error && <p className="text-sm text-danger">{state.error}</p>}

      <button type="submit" disabled={pending} className="btn-primary w-full !py-2">
        {pending ? "Adding..." : "Add task"}
      </button>
    </form>
  );
}
