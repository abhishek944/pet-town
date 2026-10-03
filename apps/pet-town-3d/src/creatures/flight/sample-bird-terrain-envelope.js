import { getCreatureTerrain } from "../world/get-creature-terrain.js";
import { sampleCreatureTerrainHeight } from "../world/sample-creature-terrain-height.js";

// Native terrain columns are one world unit: toGridCoordinate=floor(world+half).
// Include every column intersecting the wing footprint, including interior cells.
export function sampleBirdTerrainEnvelope(x, z, padding) {
  const terrain = getCreatureTerrain();
  if (!Number.isFinite(terrain?.size)) return null;
  const originX = terrain.bounds?.minX ?? -terrain.size / 2;
  const originZ = terrain.bounds?.minZ ?? -terrain.size / 2;
  const minX = Math.floor(x - padding - originX);
  const maxX = Math.floor(x + padding - originX);
  const minZ = Math.floor(z - padding - originZ);
  const maxZ = Math.floor(z + padding - originZ);
  let terrainTop = -Infinity;
  let terrainBottom = Infinity;
  for (let cellX = minX; cellX <= maxX; cellX++) {
    for (let cellZ = minZ; cellZ <= maxZ; cellZ++) {
      const height = sampleCreatureTerrainHeight(originX + cellX + 0.5, originZ + cellZ + 0.5);
      if (height == null) return null;
      terrainTop = Math.max(terrainTop, height);
      terrainBottom = Math.min(terrainBottom, height);
    }
  }
  return { terrainTop, terrainBottom };
}
