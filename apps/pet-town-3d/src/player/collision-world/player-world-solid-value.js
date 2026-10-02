/** Terrain, voxel and prop collision queries, walkable platforms, water and camera occlusion. */
import { playerState } from "../state.js";
export function playerWorldSolidValue(block) {
  if (block === 0 || block == null || block === false || block === `` || this.waterIds.has(block)) {
    return false;
  }
  if (typeof block == `string`) {
    return !playerState.playerNonSolidBlockPattern.test(block) && !/water/i.test(block);
  }
  if (typeof block == `object`) {
    if (block.solid === false || block.collide === false) {
      return false;
    }
    let result = block.name ?? block.type ?? block.id;
    return result == null || this.solidValue(result);
  }
  return true;
}
