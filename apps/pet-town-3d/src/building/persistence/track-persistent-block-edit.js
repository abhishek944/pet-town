/** Serialize, save, restore and reset player block changes. */
import { blockCoordinateKey } from "../state/block-coordinate-key.js";
import { buildingState } from "../state.js";
import { serializeBuildingBlockState } from "./serialize-building-block-state.js";
import { saveWorldEdits } from "./save-world-edits.js";
export function trackPersistentBlockEdit(x, y, z, previousState, nextState) {
  let blockCoordinateKeyResult = blockCoordinateKey(x, y, z);
  let result = buildingState.worldPersistenceState.edits.get(blockCoordinateKeyResult);
  let result2 = result ? result[4] : serializeBuildingBlockState(previousState);
  let serializeBuildingBlockStateResult = serializeBuildingBlockState(nextState);
  buildingState.worldPersistenceState.edits.delete(blockCoordinateKeyResult);
  if (serializeBuildingBlockStateResult !== result2) {
    buildingState.worldPersistenceState.edits.set(blockCoordinateKeyResult, [
      x,
      y,
      z,
      serializeBuildingBlockStateResult,
      result2,
    ]);
  }
  buildingState.worldPersistenceState.dirty = true;
  clearTimeout(buildingState.worldPersistenceState.timer);
  buildingState.worldPersistenceState.timer = setTimeout(saveWorldEdits, 700);
}
