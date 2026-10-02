/** Animated edits, placement constraints, undo/redo and block selection. */
import { getPlayerBuildingBounds } from "./get-player-building-bounds.js";
export function doesBlockOverlapPlayer(x, y, z, padding = 0) {
  let playerBuildingBoundsResult = getPlayerBuildingBounds();
  if (!playerBuildingBoundsResult) {
    return false;
  }
  let result = 0.01 - padding;
  return (
    x + 1 > playerBuildingBoundsResult.minX + result &&
    x < playerBuildingBoundsResult.maxX - result &&
    y + 1 > playerBuildingBoundsResult.minY + result &&
    y < playerBuildingBoundsResult.maxY - result &&
    z + 1 > playerBuildingBoundsResult.minZ + result &&
    z < playerBuildingBoundsResult.maxZ - result
  );
}
