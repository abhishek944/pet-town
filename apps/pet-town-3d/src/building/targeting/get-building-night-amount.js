/** Front-facing and cursor targets, ghost placement visualization and lantern light updates. */
import { buildingState } from "../state.js";
export function getBuildingNightAmount() {
  let result = buildingState.buildingContext.timeOfDay ?? 0.4;
  return 1 - Math.min(1, Math.max(0, Math.min((result - 0.21) / 0.06, (0.82 - result) / 0.06)));
}
