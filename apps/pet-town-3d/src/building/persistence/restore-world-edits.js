/** Serialize, save, restore and reset player block changes. */
import { readSavedValue } from "../../persistence/storage/read-saved-value.js";
import { buildingState } from "../state.js";
import { flushPendingBlockPlacements } from "../meshes/flush-pending-block-placements.js";
import { deserializeBuildingBlockState } from "./deserialize-building-block-state.js";
import { applyBuildingBlockState } from "../block-edits/apply-building-block-state.js";
import { blockCoordinateKey } from "../state/block-coordinate-key.js";
import { isCompatibleWorldTerrainSignature } from "./get-world-terrain-signature.js";
export async function restoreWorldEdits() {
  const generation = buildingState.worldPersistenceState.restoreGeneration;
  let savedWorld;
  try {
    // World and shader startup can occupy the main thread for several seconds.
    // Wait for the storage result instead of treating delayed callbacks as no save.
    savedWorld = await readSavedValue(buildingState.worldSaveKey);
  } catch {
    savedWorld = null;
  }
  if (generation !== buildingState.worldPersistenceState.restoreGeneration) return;
  if (
    ((buildingState.worldPersistenceState.loaded = true),
    savedWorld &&
      savedWorld.v === 1 &&
      isCompatibleWorldTerrainSignature(savedWorld.sig) &&
      Array.isArray(savedWorld.edits))
  ) {
    flushPendingBlockPlacements();
    buildingState.worldPersistenceState.replaying = true;
    for (let edit of savedWorld.edits) {
      let [x, y, z, savedKey, originalKey] = edit;
      if (![x, y, z].every(Number.isInteger)) {
        continue;
      }
      let blockState = deserializeBuildingBlockState(savedKey);
      if (blockState) {
        applyBuildingBlockState(x, y, z, blockState);
        buildingState.worldPersistenceState.edits.set(blockCoordinateKey(x, y, z), [
          x,
          y,
          z,
          savedKey,
          originalKey,
        ]);
        buildingState.worldPersistenceState.restored++;
      }
    }
    buildingState.worldPersistenceState.replaying = false;
    if (buildingState.worldPersistenceState.restored) {
      buildingState.worldPersistenceState.toast = true;
    }
  }
}
