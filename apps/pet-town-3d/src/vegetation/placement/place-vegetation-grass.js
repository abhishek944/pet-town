import { placeVegetationDuneTuft } from "./place-vegetation-dune-tuft.js";
/** Vegetation clearings, flower palettes and biome-aware world population. */

import { vegetationState } from "../state.js";
import { vegetationFractalNoise2d } from "../random/vegetation-fractal-noise2d.js";
import { vegetationHash2d } from "../random/vegetation-hash2d.js";
import { vegetationSmoothstep } from "../random/vegetation-smoothstep.js";
export function placeVegetationGrass(world) {
  for (let cell = 0; cell < world.cellCount; cell++) {
    if (!world.isLand(cell)) {
      continue;
    }
    let biome = world.ground.biome[cell];
    let surface = world.ground.top[cell];
    let x = world.cellX(cell);
    let z = world.cellZ(cell);
    if (
      surface === vegetationState.vegetationSurfaceIds.OTHER ||
      biome === vegetationState.vegetationBiomeIds.TOWN
    ) {
      continue;
    }
    let isSand =
      surface === vegetationState.vegetationSurfaceIds.SAND ||
      (surface === -1 &&
        (biome === vegetationState.vegetationBiomeIds.BEACH ||
          biome === vegetationState.vegetationBiomeIds.DESERT));
    let isRockOrSnow =
      surface === vegetationState.vegetationSurfaceIds.STONE ||
      surface === vegetationState.vegetationSurfaceIds.SNOW ||
      biome === vegetationState.vegetationBiomeIds.SNOW;
    let isDirt = surface === vegetationState.vegetationSurfaceIds.DIRT;
    if (isSand) {
      placeVegetationDuneTuft(world, cell, x, z);
      continue;
    }
    let density =
      biome === vegetationState.vegetationBiomeIds.MEADOW
        ? 1
        : biome === vegetationState.vegetationBiomeIds.FOREST
          ? 0.85
          : biome === vegetationState.vegetationBiomeIds.SWAMP
            ? 1.1
            : biome === vegetationState.vegetationBiomeIds.HILLS
              ? 0.85
              : biome === vegetationState.vegetationBiomeIds.MOUNTAIN
                ? 0.65
                : biome === vegetationState.vegetationBiomeIds.BEACH
                  ? 0.5
                  : 0.6;
    if (isRockOrSnow) {
      density *= 0.12;
    }
    if (isDirt) {
      density *= 0.25;
    }
    if (world.ground.slope[cell] > 1.01) {
      density *= 0.6;
    }
    if (world.occupied[cell] & 32) {
      density *= 0.5;
    }
    let densityNoise = vegetationFractalNoise2d(x * 0.09 + 5.5, z * 0.09 + 9.1, world.seed + 3);
    density *= 0.3 + 2.2 * vegetationSmoothstep(0.28, 0.72, densityNoise);
    let besidePath = 0;
    for (let [neighborX, neighborZ] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      let neighbor = world.neighborCell(cell, neighborX, neighborZ);
      if (
        neighbor >= 0 &&
        world.ground.top[neighbor] === vegetationState.vegetationSurfaceIds.OTHER &&
        Math.abs(world.ground.h[neighbor] - world.ground.h[cell]) < 0.6
      ) {
        besidePath = 1;
      }
    }
    if (besidePath) {
      density = Math.max(density, 1.6);
    }
    let vegetationFractalNoise2dResult4 = vegetationFractalNoise2d(
      x * 0.05 + 101,
      z * 0.12 - 33,
      world.seed + 8,
    );
    let result115 =
      (biome === vegetationState.vegetationBiomeIds.MEADOW ||
        biome === vegetationState.vegetationBiomeIds.FOREST ||
        biome === vegetationState.vegetationBiomeIds.SWAMP ||
        biome === vegetationState.vegetationBiomeIds.HILLS) &&
      vegetationFractalNoise2dResult4 > 0.6 &&
      !isRockOrSnow &&
      !isDirt &&
      !world.isNearSpawn(x, z, 2.5);
    if (result115) {
      world.tallGrassCells[cell] = 1;
    }
    let result116 = Math.floor(
      density * 3.2 * world.grassDensity + vegetationHash2d(cell, 44, world.seed),
    );
    for (let index23 = 0; index23 < result116; index23++) {
      let result120 = 0.1 + vegetationHash2d(cell, 50 + index23, world.seed) * 0.8;
      let result121 = 0.1 + vegetationHash2d(cell, 60 + index23, world.seed) * 0.8;
      let result122 = world.ground.minX + (cell % world.ground.nx) + result120;
      let result123 = world.ground.minZ + ((cell / world.ground.nx) | 0) + result121;
      if (
        (world.occupied[cell] & 1 && world.isNearTree(result122, result123, 0.12)) ||
        world.isCleared(result122, result123, `small`)
      ) {
        continue;
      }
      let result124 =
        Math.floor(vegetationHash2d(cell, 70 + index23, world.seed) * world.grassVariants) %
        world.grassVariants;
      let result125 =
        (0.68 + vegetationHash2d(cell, 95 + index23, world.seed) * 0.38) * (besidePath ? 1.12 : 1);
      let result126 = 0.85 + vegetationHash2d(cell, 96 + index23, world.seed) * 0.35;
      let result127 = 0.78 + vegetationHash2d(cell, 97 + index23, world.seed) * 0.5;
      world.register(
        world.fields[`grass` + result124].add(
          result122,
          world.ground.h[cell] - 0.02,
          result123,
          vegetationHash2d(cell, 90 + index23, world.seed) * 6.28,
          result125 * result126,
          result125 * result127,
          result125 * (2 - result126),
          world.groundTint(cell, index23, world.tint),
          {
            rank: vegetationHash2d(cell, 330 + index23, world.seed),
          },
        ),
        result122,
        result123,
      );
      world.grassCount++;
    }
    if (result115) {
      let result128 =
        1 +
        Math.floor(
          vegetationSmoothstep(0.6, 0.72, vegetationFractalNoise2dResult4) * 2.5 +
            vegetationHash2d(cell, 45, world.seed),
        );
      for (let index24 = 0; index24 < result128; index24++) {
        let result129 = 0.2 + vegetationHash2d(cell, 110 + index24, world.seed) * 0.6;
        let result130 = 0.2 + vegetationHash2d(cell, 120 + index24, world.seed) * 0.6;
        let result131 = world.ground.minX + (cell % world.ground.nx) + result129;
        let result132 = world.ground.minZ + ((cell / world.ground.nx) | 0) + result130;
        if (
          (world.occupied[cell] & 1 && world.isNearTree(result131, result132, 0.3)) ||
          world.isCleared(result131, result132, `small`)
        ) {
          continue;
        }
        let result133 =
          Math.floor(vegetationHash2d(cell, 130 + index24, world.seed) * world.tallGrassVariants) %
          world.tallGrassVariants;
        world.groundTint(cell, 20 + index24, world.tint).multiplyScalar(1.02);
        world.register(
          world.fields[`tall` + result133].add(
            result131,
            world.ground.h[cell] - 0.03,
            result132,
            vegetationHash2d(cell, 150 + index24, world.seed) * 6.28,
            0.85 + vegetationHash2d(cell, 155 + index24, world.seed) * 0.35,
            0.8 + vegetationHash2d(cell, 160 + index24, world.seed) * 0.45,
            null,
            world.tint,
            {
              rank: vegetationHash2d(cell, 360 + index24, world.seed),
            },
          ),
          result131,
          result132,
        );
        world.tallGrassCount++;
      }
    }
  }
}
