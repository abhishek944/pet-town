/** Building API module, hotbar state, history queues, skin assignments and terrain resolution. */
import { buildingState } from "../state.js";
export function wakeBuildingInteraction() {
  let result = performance.now();
  buildingState.buildingRuntime.activeUntil = result + buildingState.buildingActivityDuration;
  buildingState.buildingRuntime.lastInputAt = result;
}
