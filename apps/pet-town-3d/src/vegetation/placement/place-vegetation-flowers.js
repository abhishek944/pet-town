/** Vegetation clearings, flower palettes and biome-aware world population. */
import * as THREE from "three";
import { vegetationState } from "../state.js";
import { vegetationFractalNoise2d } from "../random/vegetation-fractal-noise2d.js";
import { vegetationHash2d } from "../random/vegetation-hash2d.js";
export function placeVegetationFlowers(world) {
  world.flowerColors = Object.fromEntries(
    Object.entries(vegetationState.vegetationFlowerColors).map(([value41, value42]) => [
      value41,
      new THREE.Color(value42),
    ]),
  );
  world.isFlowerSite = (value43) =>
    value43 >= 0 &&
    world.isLand(value43) &&
    !world.tallGrassCells[value43] &&
    world.isGrass(value43) &&
    !(world.occupied[value43] & 7);
  for (let index26 = 0; index26 < world.cellCount; index26++) {
    if (!world.isFlowerSite(index26)) {
      continue;
    }
    let result140 = world.ground.biome[index26];
    if (
      result140 === vegetationState.vegetationBiomeIds.TOWN ||
      result140 === vegetationState.vegetationBiomeIds.BEACH ||
      result140 === vegetationState.vegetationBiomeIds.SNOW
    ) {
      continue;
    }
    let callback2Result5 = world.cellX(index26);
    let callback3Result5 = world.cellZ(index26);
    let vegetationFractalNoise2dResult5 = vegetationFractalNoise2d(
      callback2Result5 * 0.075 + 200,
      callback3Result5 * 0.075 - 50,
      world.seed + 11,
    );
    let result141 = vegetationFractalNoise2dResult5 > 0.58;
    let result142 = result141
      ? 0.16 + (vegetationFractalNoise2dResult5 - 0.58) * 1.6
      : result140 === vegetationState.vegetationBiomeIds.MEADOW
        ? 0.014
        : result140 === vegetationState.vegetationBiomeIds.FOREST
          ? 0.006
          : 0.008;
    if (vegetationHash2d(index26, 170, world.seed) >= result142) {
      continue;
    }
    let result143 = Math.floor(callback2Result5 / 9);
    let result144 = Math.floor(callback3Result5 / 9);
    let result145 =
      vegetationState.vegetationFlowerTypes[
        Math.floor(
          vegetationHash2d(result143, result144, world.seed + 300) *
            vegetationState.vegetationFlowerTypes.length,
        ) % vegetationState.vegetationFlowerTypes.length
      ];
    if (
      result140 === vegetationState.vegetationBiomeIds.MOUNTAIN ||
      result140 === vegetationState.vegetationBiomeIds.HILLS
    ) {
      result145 = [`lavender`, `daisy`, `puff`][
        Math.floor(vegetationHash2d(result143, result144, world.seed + 47) * 3) % 3
      ];
    }
    let result146 =
      vegetationState.vegetationFlowerColorPairs[
        Math.floor(
          vegetationHash2d(result143, result144, world.seed + 301) *
            vegetationState.vegetationFlowerColorPairs.length,
        ) % vegetationState.vegetationFlowerColorPairs.length
      ];
    if (result145 === `lavender`) {
      result146 = [`lilac`, `purple`];
    } else {
      if (result145 === `puff` && (result146[0] === `white` || result146[0] === `yellow`)) {
        result146 = [`pink`, `lilac`];
      }
    }
    let result147 = result141
      ? 3 + Math.floor(vegetationHash2d(index26, 171, world.seed) * 5)
      : 1 + Math.floor(vegetationHash2d(index26, 172, world.seed) * 3);
    let result148 = result141 ? 0.35 + vegetationHash2d(index26, 173, world.seed) * 0.4 : 0.25;
    let [callback11Result11, callback11Result12] = world.cellJitter(index26 + 606, 0.6);
    for (let index27 = 0; index27 < result147; index27++) {
      let result149 = vegetationHash2d(index26, 180 + index27, world.seed) * Math.PI * 2;
      let result150 = result148 * Math.sqrt(vegetationHash2d(index26, 190 + index27, world.seed));
      let result151 = callback2Result5 + callback11Result11 + Math.cos(result149) * result150;
      let result152 = callback3Result5 + callback11Result12 + Math.sin(result149) * result150;
      let cellOfResult8 = world.ground.cellOf(result151, result152);
      if (
        !world.isFlowerSite(cellOfResult8) ||
        Math.abs(world.ground.h[cellOfResult8] - world.ground.h[index26]) > 0.01 ||
        world.isNearTree(result151, result152, 0.2) ||
        world.isCleared(result151, result152, `small`)
      ) {
        continue;
      }
      let multiplyScalarResult = world.flowerColors[
        vegetationHash2d(index26, 220 + index27, world.seed) < 0.85 ? result146[0] : result146[1]
      ]
        .clone()
        .multiplyScalar(0.94 + vegetationHash2d(index26, 240 + index27, world.seed) * 0.1);
      world.register(
        world.fields[`fl_${result145}0`].add(
          result151,
          world.ground.h[cellOfResult8] - 0.02,
          result152,
          vegetationHash2d(index26, 260 + index27, world.seed) * 6.28,
          0.9 + vegetationHash2d(index26, 270 + index27, world.seed) * 0.3,
          null,
          null,
          multiplyScalarResult,
          {
            rank: vegetationHash2d(index26, 280 + index27, world.seed),
          },
        ),
        result151,
        result152,
      );
      world.flowerCount++;
    }
  }
}
