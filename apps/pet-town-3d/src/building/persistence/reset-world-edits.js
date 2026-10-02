/** Serialize, save, restore and reset player block changes. */
import { flushPendingBlockPlacements } from "../meshes/flush-pending-block-placements.js";
import { buildingState } from "../state.js";
import { deserializeBuildingBlockState } from "./deserialize-building-block-state.js";
import { applyBuildingBlockState } from "../block-edits/apply-building-block-state.js";
import { deleteSavedValue } from "../../persistence/storage/delete-saved-value.js";
export function resetWorldEdits() {
  // A reset supersedes any saved world that is still being read.
  buildingState.worldPersistenceState.restoreGeneration++;
  buildingState.worldPersistenceState.loaded = true;
  flushPendingBlockPlacements();
  buildingState.worldPersistenceState.replaying = true;
  let reverseResult = [...buildingState.worldPersistenceState.edits.values()].reverse();
  for (let [result, result2, result3, , result4] of reverseResult) {
    let deserializeBuildingBlockStateResult = deserializeBuildingBlockState(result4);
    if (deserializeBuildingBlockStateResult) {
      applyBuildingBlockState(result, result2, result3, deserializeBuildingBlockStateResult);
    }
  }
  buildingState.worldPersistenceState.replaying = false;
  buildingState.worldPersistenceState.edits.clear();
  buildingState.worldPersistenceState.dirty = false;
  clearTimeout(buildingState.worldPersistenceState.timer);
  buildingState.buildingUndoHistory.fill(undefined);
  buildingState.buildingUndoCursor = buildingState.buildingUndoCount = 0;
  buildingState.buildingRedoHistory.length = 0;
  deleteSavedValue(buildingState.worldSaveKey);
  return reverseResult.length;
}
