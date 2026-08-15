"use client";

import { useState, useTransition } from "react";
import { FiCheck, FiPause, FiPlay } from "react-icons/fi";
import {
  markTaskDoneAction,
  updateTaskIntervalAction,
  toggleTaskPauseAction,
} from "@/lib/care-tasks/actions";
import { getDueStatus } from "@/lib/care-tasks/dueStatus";

const TONE_CLASSES = {
  paused: "bg-neutral-100 text-neutral-500",
  overdue: "bg-red-100 text-red-700",
  soon: "bg-amber-100 text-amber-700",
  ok: "bg-green-100 text-green-700",
};

export default function CareTaskRow({ task }) {
  const [isPending, startTransition] = useTransition();
  const [interval, setInterval] = useState(task.interval_days);
  const [error, setError] = useState(null);

  const status = getDueStatus(task);

  function run(action) {
    setError(null);
    startTransition(async () => {
      try {
        await action();
      } catch (err) {
        setError(err.message);
      }
    });
  }

  function handleMarkDone() {
    run(() => markTaskDoneAction(task.id, task.plant_id));
  }

  function handleIntervalBlur() {
    if (interval === task.interval_days) return;
    run(() => updateTaskIntervalAction(task.id, task.plant_id, interval));
  }

  function handleTogglePause() {
    run(() => toggleTaskPauseAction(task.id, task.plant_id, !task.is_paused));
  }

  return (
    <div className="rounded-md border border-neutral-200 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="font-medium">{task.display_name}</p>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${TONE_CLASSES[status.tone]}`}>
          {status.label}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-neutral-600">
        <label className="flex items-center gap-1.5">
          every
          <input
            type="number"
            min={1}
            value={interval}
            disabled={isPending}
            onChange={(e) => setInterval(Number(e.target.value) || 1)}
            onBlur={handleIntervalBlur}
            className="w-14 rounded-md border border-neutral-300 px-2 py-1 text-center"
          />
          days
        </label>

        <button
          type="button"
          onClick={handleMarkDone}
          disabled={isPending}
          className="flex items-center gap-1 rounded-md bg-neutral-900 px-2.5 py-1 text-white transition hover:bg-neutral-800 disabled:opacity-50"
        >
          <FiCheck size={14} />
          Mark done
        </button>

        <button
          type="button"
          onClick={handleTogglePause}
          disabled={isPending}
          className="flex items-center gap-1 rounded-md border border-neutral-300 px-2.5 py-1 transition hover:bg-neutral-50 disabled:opacity-50"
        >
          {task.is_paused ? <FiPlay size={14} /> : <FiPause size={14} />}
          {task.is_paused ? "Resume" : "Pause"}
        </button>
      </div>

      {task.last_completed_at && (
        <p className="mt-1.5 text-xs text-neutral-400">
          Last done {new Date(task.last_completed_at).toLocaleDateString()}
        </p>
      )}
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  );
}
