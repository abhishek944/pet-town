/** Animated edits, placement constraints, undo/redo and block selection. */
import { buildingState } from "../state.js";
export function getPlayerBuildingBounds() {
  let player2 = buildingState.buildingContext.player;
  let position2 = player2?.position ?? player2?.mesh?.position;
  if (!position2) {
    return null;
  }
  let result = player2.params?.halfW ?? player2.radius ?? 0.3;
  let result2 = player2.params?.height ?? player2.height ?? 1.5;
  return {
    minX: position2.x - result,
    maxX: position2.x + result,
    minY: position2.y,
    maxY: position2.y + result2,
    minZ: position2.z - result,
    maxZ: position2.z + result,
  };
}
