export default function TaskIntervalRow({ task, onChange }) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-neutral-200 p-3">
      <div className="flex-1">
        <p className="text-sm font-medium">{task.display_name}</p>
      </div>
      <label className="flex items-center gap-1.5 text-sm text-neutral-600">
        every
        <input
          type="number"
          min={1}
          value={task.interval_days}
          onChange={(e) =>
            onChange({ ...task, interval_days: Number(e.target.value) || 1 })
          }
          className="w-16 rounded-md border border-neutral-300 px-2 py-1 text-center"
        />
        days
      </label>
      <label className="flex items-center gap-1.5 text-sm text-neutral-600">
        <input
          type="checkbox"
          checked={task.is_paused}
          onChange={(e) => onChange({ ...task, is_paused: e.target.checked })}
        />
        Paused
      </label>
    </div>
  );
}
