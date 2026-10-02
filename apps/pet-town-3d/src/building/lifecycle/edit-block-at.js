/** Initialize building, expose extension commands and update the subsystem each frame. */
import { buildingState } from "../state.js";
import { getBuildingBlockState } from "../terrain-adapter/get-building-block-state.js";
import { recordBuildingUndo } from "../commands/record-building-undo.js";
import { animateBuildingBlockChange } from "../commands/animate-building-block-change.js";
export function placeBlockAt(x, y, z, key, { animate = false, undoable = true } = {}) {
  let block = buildingState.resolvedBuildingPalette.find((entry) => entry.key === key);
  if (!block?.available) {
    return false;
  }
  x = Math.floor(x);
  y = Math.floor(y);
  z = Math.floor(z);
  let nextState = {
    id: block.resolvedId,
    skin: block.skin,
  };
  if (undoable) {
    recordBuildingUndo({
      x: x,
      y: y,
      z: z,
      prev: getBuildingBlockState(x, y, z),
      next: nextState,
    });
  }
  animateBuildingBlockChange(x, y, z, nextState, animate);
  return true;
}
export function breakBlockAt(x, y, z, { animate = false, undoable = true } = {}) {
  x = Math.floor(x);
  y = Math.floor(y);
  z = Math.floor(z);
  let nextState = {
    id: buildingState.buildingRuntime.airId,
    skin: null,
  };
  if (undoable) {
    recordBuildingUndo({
      x: x,
      y: y,
      z: z,
      prev: getBuildingBlockState(x, y, z),
      next: nextState,
    });
  }
  animateBuildingBlockChange(x, y, z, nextState, animate);
  return true;
}
