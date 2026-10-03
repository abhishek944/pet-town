import { GARDEN_POSITION } from "./places.js";

/** Check every voxel column under the complete planter, including its outer rails. */
export function getGardenSupport(terrain) {
  const { x, z } = GARDEN_POSITION;
  const height = terrain.topY(x, z);
  if (!Number.isFinite(height) || height <= terrain.waterLevel) return null;
  for (let cellZ = Math.floor(z - 1.1); cellZ <= Math.floor(z + 1.1); cellZ++) {
    for (let cellX = Math.floor(x - 1.65); cellX <= Math.floor(x + 1.65); cellX++) {
      const top = terrain.topY(cellX + 0.5, cellZ + 0.5);
      if (!Number.isFinite(top) || top <= terrain.waterLevel || Math.abs(top - height) > 0.1)
        return null;
    }
  }
  return height;
}
