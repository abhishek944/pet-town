/** Animated edits, placement constraints, undo/redo and block selection. */
import { getBuildingBlockState } from "../terrain-adapter/get-building-block-state.js";
import { buildingState } from "../state.js";
import { getBuildingBlockKey } from "../terrain-adapter/get-building-block-key.js";
import { applyBuildingBlockState } from "../block-edits/apply-building-block-state.js";
import { createBlockAnimation } from "../meshes/create-block-animation.js";
export function animateBuildingBlockChange(x, y, z, blockState, animate = true) {
  let buildingBlockStateResult = getBuildingBlockState(x, y, z);
  if (!blockState.id || blockState.id === buildingState.buildingRuntime.airId) {
    let result2 = getBuildingBlockKey(buildingBlockStateResult) ?? `dirt`;
    applyBuildingBlockState(x, y, z, {
      id: buildingState.buildingRuntime.airId,
      skin: null,
    });
    let result3 =
      buildingBlockStateResult.skin ??
      (buildingState.resolvedBuildingPalette.some(
        (nativeValue) => nativeValue.native && nativeValue.key === result2,
      )
        ? result2
        : Array.isArray(buildingState.buildingTerrain?.blocks)
          ? `tid:` + buildingBlockStateResult.id
          : `dirt`);
    if (animate) {
      createBlockAnimation(`crumble`, x, y, z, result3);
    }
    return result2;
  }
  let result = blockState.skin ?? getBuildingBlockKey(blockState) ?? `stone`;
  if (animate) {
    createBlockAnimation(
      `pop`,
      x,
      y,
      z,
      buildingState.resolvedBuildingPalette.some((keyValue) => keyValue.key === result)
        ? result
        : `stone`,
    );
    buildingState.pendingBlockPlacements.push({
      x: x,
      y: y,
      z: z,
      state: blockState,
      t: 0.09,
    });
  } else {
    applyBuildingBlockState(x, y, z, blockState);
  }
  return result;
}
