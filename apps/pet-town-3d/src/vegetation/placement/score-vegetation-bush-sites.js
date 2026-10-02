/** Vegetation clearings, flower palettes and biome-aware world population. */

import { vegetationState } from "../state.js";
import { vegetationHash2d } from "../random/vegetation-hash2d.js";
import { vegetationSmoothstep } from "../random/vegetation-smoothstep.js";
export function scoreVegetationBushSites(world) {
  world.bushBudget = Math.round(130 * world.areaScale);
  world.bushPositions = [];
  world.bushCandidates = [];
  for (let index18 = 0; index18 < world.cellCount; index18++) {
    if (!world.isLand(index18) || world.occupied[index18] & 7) {
      continue;
    }
    let result69 = world.ground.biome[index18];
    if (
      result69 === vegetationState.vegetationBiomeIds.BEACH ||
      result69 === vegetationState.vegetationBiomeIds.SNOW ||
      result69 === vegetationState.vegetationBiomeIds.TOWN ||
      result69 === vegetationState.vegetationBiomeIds.DESERT ||
      !world.isSoil(index18) ||
      world.isNearSpawn(world.cellX(index18), world.cellZ(index18), 3.5)
    ) {
      continue;
    }
    let callback7Result2 = world.forestNoise(world.cellX(index18), world.cellZ(index18));
    let result70 =
      result69 === vegetationState.vegetationBiomeIds.FOREST
        ? 0.6
        : result69 === vegetationState.vegetationBiomeIds.MOUNTAIN
          ? 0.2
          : result69 === vegetationState.vegetationBiomeIds.HILLS
            ? 0.35
            : 0.25 + 0.6 * vegetationSmoothstep(0.42, 0.6, callback7Result2);
    if (world.occupied[index18] & 16) {
      result70 += 0.35;
    }
    world.bushCandidates.push({
      i: index18,
      score: result70 * (0.2 + vegetationHash2d(index18, 21, world.seed)),
    });
  }
  world.bushCandidates.sort((scoreValue3, scoreValue4) => scoreValue4.score - scoreValue3.score);
}
