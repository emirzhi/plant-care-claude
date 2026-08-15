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
        className="btn !py-2 text-danger hover:bg-danger-soft"
      >
        <FiTrash2 size={15} />
        Delete
      </button>
    </form>
  );
}
