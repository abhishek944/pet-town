/** Terrain access, solid-block queries and raycast normalization with voxel-grid fallback. */
import { buildingState } from "../state.js";
export let getBuildingBlockKey = (blockState) =>
  blockState.skin ??
  buildingState.buildingRuntime.idToKey.get(blockState.id) ??
  buildingState.resolvedBuildingPalette.find(
    (nativeValue) => nativeValue.native && nativeValue.resolvedId === blockState.id,
  )?.key ??
  null;
