import { CARE_TASK_ICONS } from "@/components/care-tasks/taskIcons";

export default function TaskIntervalRow({ task, onChange }) {
  const Icon = CARE_TASK_ICONS[task.task_type] ?? CARE_TASK_ICONS.custom;

  return (
    <div
      className={`card flex items-center gap-3 p-3 transition ${
        task.is_paused ? "opacity-55" : ""
      }`}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-ink-muted">
        <Icon size={16} />
      </span>

      <p className="flex-1 truncate text-sm font-medium text-ink">
        {task.display_name}
      </p>

      <label className="flex items-center gap-1.5 text-[13px] text-ink-muted">
        every
        <input
          type="number"
          min={1}
          value={task.interval_days}
          onChange={(e) =>
            onChange({ ...task, interval_days: Number(e.target.value) || 1 })
          }
          className="field w-14 !px-2 !py-1 text-center !text-[13px]"
        />
        d
      </label>

      <button
        type="button"
        onClick={() => onChange({ ...task, is_paused: !task.is_paused })}
        className={`pill shrink-0 transition ${
          task.is_paused
            ? "bg-surface-muted text-ink-faint"
            : "bg-brand-soft text-brand-soft-ink"
        }`}
      >
        {task.is_paused ? "Off" : "On"}
      </button>
    </div>
  );
}
