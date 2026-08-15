"use client";

import { useState, useTransition } from "react";
import { FiCheck, FiPause, FiPlay } from "react-icons/fi";
import {
  markTaskDoneAction,
  updateTaskIntervalAction,
  toggleTaskPauseAction,
} from "@/lib/care-tasks/actions";
import { getDueStatus } from "@/lib/care-tasks/dueStatus";
import { CARE_TASK_ICONS } from "@/components/care-tasks/taskIcons";

const TONE_CLASSES = {
  paused: "bg-surface-muted text-ink-faint",
  overdue: "bg-danger-soft text-danger-soft-ink",
  soon: "bg-warn-soft text-warn-soft-ink",
  ok: "bg-ok-soft text-ok-soft-ink",
};

export default function CareTaskRow({ task }) {
  const [isPending, startTransition] = useTransition();
  const [interval, setInterval] = useState(task.interval_days);
  const [error, setError] = useState(null);

  const status = getDueStatus(task);
  const Icon = CARE_TASK_ICONS[task.task_type] ?? CARE_TASK_ICONS.custom;

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

  return (
    <div
      className={`card p-4 transition ${isPending ? "opacity-60" : ""} ${
        task.is_paused ? "opacity-75" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-ink-muted">
            <Icon size={16} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ink">
              {task.display_name}
            </p>
            {task.last_completed_at && (
              <p className="text-xs text-ink-faint">
                Last done {new Date(task.last_completed_at).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        <span className={`pill shrink-0 ${TONE_CLASSES[status.tone]}`}>
          {status.label}
        </span>
      </div>

      <div className="mt-3.5 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => run(() => markTaskDoneAction(task.id, task.plant_id))}
          disabled={isPending}
          className="btn-primary !px-3 !py-1.5 !text-[13px]"
        >
          <FiCheck size={14} />
          Done
        </button>

        <button
          type="button"
          onClick={() =>
            run(() => toggleTaskPauseAction(task.id, task.plant_id, !task.is_paused))
          }
          disabled={isPending}
          className="btn-secondary !px-3 !py-1.5 !text-[13px]"
        >
          {task.is_paused ? <FiPlay size={14} /> : <FiPause size={14} />}
          {task.is_paused ? "Resume" : "Pause"}
        </button>

        <label className="ml-auto flex items-center gap-1.5 text-[13px] text-ink-muted">
          every
          <input
            type="number"
            min={1}
            value={interval}
            disabled={isPending}
            onChange={(e) => setInterval(Number(e.target.value) || 1)}
            onBlur={() => {
              if (interval !== task.interval_days) {
                run(() =>
                  updateTaskIntervalAction(task.id, task.plant_id, interval),
                );
              }
            }}
            className="field w-14 !px-2 !py-1 text-center !text-[13px]"
          />
          days
        </label>
      </div>

      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
    </div>
  );
}
