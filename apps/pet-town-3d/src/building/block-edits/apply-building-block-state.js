/** Block edit feedback and canonical block-state application. */
import { blockCoordinateKey } from "../state/block-coordinate-key.js";
import { buildingState } from "../state.js";
import { trackPersistentBlockEdit } from "../persistence/track-persistent-block-edit.js";
import { getBuildingBlockState } from "../terrain-adapter/get-building-block-state.js";
import { getBuildingBlockKey } from "../terrain-adapter/get-building-block-key.js";
import { writeTerrainBlock } from "../terrain-adapter/write-terrain-block.js";
export function applyBuildingBlockState(x, y, z, blockState) {
  let blockCoordinateKeyResult = blockCoordinateKey(x, y, z);
  if (buildingState.worldPersistenceState.on && !buildingState.worldPersistenceState.replaying) {
    trackPersistentBlockEdit(x, y, z, getBuildingBlockState(x, y, z), blockState);
  }
  if (blockState.skin) {
    buildingState.blockSkinAssignments.set(blockCoordinateKeyResult, {
      key: blockState.skin,
      proxyId: blockState.id,
    });
  } else {
    buildingState.blockSkinAssignments.delete(blockCoordinateKeyResult);
  }
  if ((blockState.skin ?? getBuildingBlockKey(blockState)) === `lantern`) {
    buildingState.placedLanternCoordinates.add(blockCoordinateKeyResult);
  } else {
    buildingState.placedLanternCoordinates.delete(blockCoordinateKeyResult);
  }
  buildingState.blockSkinsDirty = true;
  writeTerrainBlock(x, y, z, blockState.id);
}
