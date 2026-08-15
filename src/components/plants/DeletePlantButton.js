"use client";

import { FiTrash2 } from "react-icons/fi";
import { deletePlantAction } from "@/lib/plants/actions";

export default function DeletePlantButton({ plantId }) {
  return (
    <form
      action={deletePlantAction.bind(null, plantId)}
      onSubmit={(e) => {
        if (!confirm("Delete this plant and all its care tasks?")) {
          e.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        className="flex items-center gap-1.5 rounded-md border border-red-200 px-3 py-1.5 text-sm text-red-600 transition hover:bg-red-50"
      >
        <FiTrash2 size={15} />
        Delete
      </button>
    </form>
  );
}
