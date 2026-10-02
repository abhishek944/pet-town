/** Vegetation clearings, flower palettes and biome-aware world population. */

import { vegetationState } from "../state.js";
import { vegetationFractalNoise2d } from "../random/vegetation-fractal-noise2d.js";
import { vegetationHash2d } from "../random/vegetation-hash2d.js";
export function configureVegetationPlacementQueries(world) {
  world.cellX = (value2) => world.ground.minX + (value2 % world.ground.nx) + 0.5;
  world.cellZ = (value3) => world.ground.minZ + ((value3 / world.ground.nx) | 0) + 0.5;
  world.neighborCell = (value4, value5, value6) =>
    world.ground.idx(
      (value4 % world.ground.nx) + value5,
      ((value4 / world.ground.nx) | 0) + value6,
    );
  world.maximumNearbyHeight = (value7, value8) => {
    let result9 = -1 / 0;
    for (let result10 = -value8; result10 <= value8; result10++) {
      for (let result11 = -value8; result11 <= value8; result11++) {
        let callback4Result = world.neighborCell(value7, result11, result10);
        if (callback4Result >= 0 && world.ground.valid[callback4Result]) {
          result9 = Math.max(result9, world.ground.h[callback4Result]);
        }
      }
    }
    return result9;
  };
  world.distanceToLedge = (value9, value10) => {
    let result12 = world.ground.h[value9];
    for (let result13 = 1; result13 <= value10; result13++) {
      for (let result14 = -result13; result14 <= result13; result14++) {
        for (let result15 = -result13; result15 <= result13; result15++) {
          if (Math.max(Math.abs(result15), Math.abs(result14)) !== result13) {
            continue;
          }
          let callback4Result2 = world.neighborCell(value9, result15, result14);
          if (
            callback4Result2 < 0 ||
            !world.ground.valid[callback4Result2] ||
            world.ground.h[callback4Result2] < result12 - 0.01 ||
            !Number.isNaN(world.ground.water[callback4Result2])
          ) {
            return result13 - 0.5;
          }
        }
      }
    }
    return value10 + 0.5;
  };
  world.forestNoise = (value11, value12) =>
    vegetationFractalNoise2d(value11 * 0.055 + 11.3, value12 * 0.055 - 4.1, world.seed + 5);
  world.isGrass = (value13) =>
    world.ground.top[value13] === vegetationState.vegetationSurfaceIds.GRASS ||
    world.ground.top[value13] === -1;
  world.isSoil = (value14) =>
    world.isGrass(value14) ||
    world.ground.top[value14] === vegetationState.vegetationSurfaceIds.DIRT;
  world.spawn = vegetationState.vegetationRuntimeState.ctx.terrain?.spawn;
  world.isNearSpawn = (value15, value16, value17) =>
    !!world.spawn &&
    Number.isFinite(world.spawn.x) &&
    Math.hypot(value15 - world.spawn.x, value16 - world.spawn.z) < value17;
  world.cellJitter = (value18, value19) => [
    (vegetationHash2d(value18, 7, world.seed) - 0.5) * value19,
    (vegetationHash2d(value18, 13, world.seed) - 0.5) * value19,
  ];
  world.isNearOcean = (value20, value21) =>
    world.ground.hasOcean && world.ground.oceanShore[value20] <= value21;
  world.isNearPath = (value22, value23, value24) => {
    let result16 = Math.ceil(value24) + 1;
    for (let result17 = -result16; result17 <= result16; result17++) {
      for (let result18 = -result16; result18 <= result16; result18++) {
        let cellOfResult = world.ground.cellOf(value22 + result18, value23 + result17);
        if (
          cellOfResult < 0 ||
          world.ground.top[cellOfResult] !== vegetationState.vegetationSurfaceIds.OTHER
        ) {
          continue;
        }
        let callback2Result = world.cellX(cellOfResult);
        let callback3Result = world.cellZ(cellOfResult);
        let result19 = Math.max(Math.abs(value22 - callback2Result) - 0.5, 0);
        let result20 = Math.max(Math.abs(value23 - callback3Result) - 0.5, 0);
        if (Math.hypot(result19, result20) < value24) {
          return true;
        }
      }
    }
    return false;
  };
  world.groundRgb = [0, 0, 0];
}
