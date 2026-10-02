/** Distance-along-polyline sampling and deterministic voxel island generation. */

import { terrainState } from "../state.js";
import { measurePolylineDistance } from "./measure-polyline-distance.js";
export function assignIslandBiomes(island) {
  for (let z = 0; z < 128; z++) {
    for (let x = 0; x < 128; x++) {
      let worldX = x - 64 + 0.5;
      let worldZ = z - 64 + 0.5;
      let cell = z * 128 + x;
      if (!(island.flags[cell] & 7)) {
        for (let waypoints of terrainState.terrainPathWaypoints) {
          let pathDistance = measurePolylineDistance(
            worldX + 0.9 * island.noise(worldX * 0.21, worldZ * 0.21),
            worldZ + 0.9 * island.noise(worldX * 0.21 + 7, worldZ * 0.21),
            waypoints,
          );
          let pathWidth = 0.95 + 0.35 * island.noise(pathDistance.t * 0.3, 1.7);
          if (pathDistance.d < pathWidth && island.heights[cell] >= 8) {
            island.flags[cell] |= 8;
            break;
          }
        }
      }
    }
  }
  for (let z = 0; z < 128; z++) {
    for (let x = 0; x < 128; x++) {
      let worldX = x - 64 + 0.5;
      let worldZ = z - 64 + 0.5;
      let cell = z * 128 + x;
      let height = island.heights[cell];
      let flags = island.flags[cell];
      let surfaceType = terrainState.terrainBlockIds.GRASS;
      let biome;
      let submerged = height <= 7;
      let coastal = (island.coastMask[cell] > 0.5 || island.landMask[cell] < 0.9) && height <= 9;
      if (submerged) {
        surfaceType =
          flags & 3
            ? island.fbm(worldX * 0.3, worldZ * 0.3) > 0.25
              ? terrainState.terrainBlockIds.GRAVEL
              : terrainState.terrainBlockIds.SAND
            : island.fbm(worldX * 0.12, worldZ * 0.12) > 0.35
              ? terrainState.terrainBlockIds.GRAVEL
              : terrainState.terrainBlockIds.SAND;
        biome =
          flags & 1
            ? terrainState.terrainBiomeIds.POND
            : flags & 2
              ? terrainState.terrainBiomeIds.RIVER
              : terrainState.terrainBiomeIds.OCEAN;
      } else if (flags & 4 || coastal) {
        surfaceType = terrainState.terrainBlockIds.SAND;
        biome = terrainState.terrainBiomeIds.BEACH;
      } else if (flags & 8) {
        surfaceType = terrainState.terrainBlockIds.PATH;
        biome = terrainState.terrainBiomeIds.PATH;
      } else if (height >= 24 && island.fbm(worldX * 0.09, worldZ * 0.09, 2) > 0.28) {
        surfaceType = terrainState.terrainBlockIds.STONE;
        biome = terrainState.terrainBiomeIds.ROCKY;
      } else {
        let forestNoise = island.fbm(worldX * 0.045 - 8, worldZ * 0.045 + 2, 3);
        biome =
          flags & 16
            ? terrainState.terrainBiomeIds.MEADOW
            : height >= 19
              ? terrainState.terrainBiomeIds.MOUNTAIN
              : forestNoise > 0.12 && height >= 9
                ? terrainState.terrainBiomeIds.FOREST
                : height >= 13
                  ? terrainState.terrainBiomeIds.HILLS
                  : island.fbm(worldX * 0.06 + 20, worldZ * 0.06, 2) > 0.1
                    ? terrainState.terrainBiomeIds.MEADOW
                    : terrainState.terrainBiomeIds.PLAINS;
      }
      island.surfaceTypes[cell] = surfaceType;
      island.biomes[cell] = biome;
    }
  }
}
