import CareTaskRow from "@/components/care-tasks/CareTaskRow";
import AddCustomTaskForm from "@/components/care-tasks/AddCustomTaskForm";

export default function CareTaskList({ plantId, tasks }) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium">Care tasks</p>

      {tasks.length === 0 ? (
        <p className="text-sm text-neutral-500">No care tasks yet.</p>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <CareTaskRow key={task.id} task={task} />
          ))}
        </div>
      )}

      <AddCustomTaskForm plantId={plantId} />
    </div>
  );
}
