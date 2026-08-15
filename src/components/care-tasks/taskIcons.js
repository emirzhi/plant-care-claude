import { PiDropFill, PiFlaskFill, PiScissorsFill, PiArrowsClockwiseBold } from "react-icons/pi";
import { WiRaindrops } from "react-icons/wi";
import { FiStar } from "react-icons/fi";

// Icon per canonical care task type. Keyed by the CARE_TASK_TYPES values —
// keep in sync with src/lib/constants/care-task-types.js.
export const CARE_TASK_ICONS = {
  watering: PiDropFill,
  fertilizing: PiFlaskFill,
  misting: WiRaindrops,
  pruning: PiScissorsFill,
  rotating: PiArrowsClockwiseBold,
  custom: FiStar,
};
