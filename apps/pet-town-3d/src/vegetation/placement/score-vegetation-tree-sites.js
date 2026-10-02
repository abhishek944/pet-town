/** Vegetation clearings, flower palettes and biome-aware world population. */

import { vegetationState } from "../state.js";
import { clampVegetationValue } from "../random/clamp-vegetation-value.js";
import { vegetationFractalNoise2d } from "../random/vegetation-fractal-noise2d.js";
import { vegetationHash2d } from "../random/vegetation-hash2d.js";
import { vegetationSmoothstep } from "../random/vegetation-smoothstep.js";
export function scoreVegetationTreeSites(world) {
  vegetationState.vegetationRuntimeState.trees = [];
  vegetationState.vegetationRuntimeState.colliders = [];
  vegetationState.vegetationRuntimeState.floaters = [];
  vegetationState.vegetationRuntimeState.canopies = null;
  world.treeBudget = Math.round(
    (Number(vegetationState.vegetationRuntimeState.ctx.params?.get?.(`vegTrees`)) || 180) *
      clampVegetationValue(world.landCount / 8500, 0.35, 2.4),
  );
  world.treeCandidates = [];
  for (let index15 = 0; index15 < world.cellCount; index15++) {
    if (!world.isLand(index15)) {
      continue;
    }
    let result21 = world.ground.biome[index15];
    let callback2Result2 = world.cellX(index15);
    let callback3Result2 = world.cellZ(index15);
    let callback7Result = world.forestNoise(callback2Result2, callback3Result2);
    if (world.ground.slope[index15] > 1.01) {
      continue;
    }
    if (typeof vegetationState.vegetationRuntimeState.ctx.terrain?.slopeAt == `function`) {
      let slopeAtResult = vegetationState.vegetationRuntimeState.ctx.terrain.slopeAt(
        callback2Result2,
        callback3Result2,
      );
      if (Number.isFinite(slopeAtResult) && slopeAtResult > 1.15) {
        continue;
      }
    }
    let index16;
    let text = `oak`;
    let vegetationHash2dResult = vegetationHash2d(index15, 1, world.seed);
    let result22 =
      world.ground.shore[index15] <= 4 && world.ground.h[index15] <= world.waterLevel + 2.2;
    let result23 = world.ground.top[index15];
    if (world.isNearSpawn(callback2Result2, callback3Result2, 5)) {
      continue;
    }
    let result24 = world.ground.hasOcean
      ? world.ground.oceanShore[index15] <= 7
      : world.ground.shore[index15] <= 5;
    let vegetationFractalNoise2dResult = vegetationFractalNoise2d(
      callback2Result2 * 0.08 + 300,
      callback3Result2 * 0.08 - 120,
      world.seed + 21,
    );
    if (
      (result21 === vegetationState.vegetationBiomeIds.BEACH ||
        result21 === vegetationState.vegetationBiomeIds.DESERT ||
        result23 === vegetationState.vegetationSurfaceIds.SAND) &&
      (result24 || result21 === vegetationState.vegetationBiomeIds.DESERT)
    ) {
      if (!(result23 === vegetationState.vegetationSurfaceIds.SAND || world.isGrass(index15))) {
        continue;
      }
      let vegetationFractalNoise2dResult2 = vegetationFractalNoise2d(
        callback2Result2 * 0.09 + 70,
        callback3Result2 * 0.09 - 20,
        world.seed + 9,
      );
      index16 =
        (result22 || result21 === vegetationState.vegetationBiomeIds.DESERT ? 0.25 : 0.05) +
        0.9 * vegetationSmoothstep(0.52, 0.7, vegetationFractalNoise2dResult2);
      text = `palm`;
    } else if (
      result23 === vegetationState.vegetationSurfaceIds.OTHER ||
      result23 === vegetationState.vegetationSurfaceIds.WATER ||
      result23 === vegetationState.vegetationSurfaceIds.SAND
    ) {
      continue;
    } else if (result21 === vegetationState.vegetationBiomeIds.FOREST) {
      if (!world.isSoil(index15)) {
        continue;
      }
      index16 = 0.55 + 0.9 * vegetationSmoothstep(0.4, 0.68, callback7Result);
    } else if (
      result21 === vegetationState.vegetationBiomeIds.MEADOW ||
      result21 === vegetationState.vegetationBiomeIds.SWAMP
    ) {
      if (!world.isSoil(index15)) {
        continue;
      }
      index16 = 0.16 + 0.85 * vegetationSmoothstep(0.55, 0.75, callback7Result);
      text = `meadow`;
    } else if (result21 === vegetationState.vegetationBiomeIds.HILLS) {
      if (!world.isSoil(index15) && result23 !== vegetationState.vegetationSurfaceIds.STONE) {
        continue;
      }
      index16 = 0.2 + 0.6 * vegetationSmoothstep(0.45, 0.7, callback7Result);
      text = vegetationFractalNoise2dResult > 0.5 ? `pine` : `oak`;
      if (text === `pine`) {
        index16 = 0.1 + 0.9 * vegetationSmoothstep(0.48, 0.66, vegetationFractalNoise2dResult);
      }
    } else if (result21 === vegetationState.vegetationBiomeIds.MOUNTAIN) {
      index16 = 0.08 + 0.9 * vegetationSmoothstep(0.45, 0.65, vegetationFractalNoise2dResult);
      text = `pine`;
    } else if (result21 === vegetationState.vegetationBiomeIds.SNOW) {
      index16 = 0.08 + 0.7 * vegetationSmoothstep(0.45, 0.65, vegetationFractalNoise2dResult);
      text = `snowPine`;
    } else {
      continue;
    }
    if (
      result23 === vegetationState.vegetationSurfaceIds.STONE &&
      text !== `pine` &&
      text !== `snowPine`
    ) {
      index16 *= 0.3;
    }
    if (!(index16 <= 0)) {
      world.treeCandidates.push({
        i: index15,
        score: index16 * (0.35 + vegetationHash2dResult),
        kind: text,
        f: callback7Result,
      });
    }
  }
  world.treeCandidates.sort((scoreValue, scoreValue2) => scoreValue2.score - scoreValue.score);
}
