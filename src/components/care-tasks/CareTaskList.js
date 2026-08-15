import CareTaskRow from "@/components/care-tasks/CareTaskRow";
import AddCustomTaskForm from "@/components/care-tasks/AddCustomTaskForm";

export default function CareTaskList({ plantId, tasks }) {
  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-base font-semibold tracking-tight text-ink">
          Care schedule
        </h2>
        {tasks.length > 0 && (
          <span className="text-xs text-ink-faint">
            {tasks.length} task{tasks.length === 1 ? "" : "s"}
          </span>
        )}
      </div>

      {tasks.length === 0 ? (
        <p className="card px-4 py-8 text-center text-sm text-ink-muted">
          No care tasks yet — add one below.
        </p>
      ) : (
        <div className="space-y-2.5">
          {tasks.map((task) => (
            <CareTaskRow key={task.id} task={task} />
          ))}
        </div>
      )}

      <AddCustomTaskForm plantId={plantId} />
    </section>
  );
}
