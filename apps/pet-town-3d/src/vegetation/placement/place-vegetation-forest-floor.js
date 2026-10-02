/** Vegetation clearings, flower palettes and biome-aware world population. */
import * as THREE from "three";
import { vegetationState } from "../state.js";
import { vegetationHash2d } from "../random/vegetation-hash2d.js";
export function placeVegetationForestFloor(world) {
  world.fernCount = 0;
  world.cloverCount = 0;
  world.saplingCount = 0;
  for (let index19 = 0; index19 < world.cellCount; index19++) {
    if (!world.isLand(index19) || world.occupied[index19] & 7 || !world.isSoil(index19)) {
      continue;
    }
    let result85 = world.ground.biome[index19];
    let result86 = world.canopyShade[index19];
    let result87 = result85 === vegetationState.vegetationBiomeIds.FOREST;
    if (
      (!result87 && result86 < 0.25) ||
      result85 === vegetationState.vegetationBiomeIds.BEACH ||
      result85 === vegetationState.vegetationBiomeIds.TOWN
    ) {
      continue;
    }
    let [callback11Result5, callback11Result6] = world.cellJitter(index19 + 4242, 0.55);
    let result88 = world.cellX(index19) + callback11Result5;
    let result89 = world.cellZ(index19) + callback11Result6;
    if (
      world.isNearTree(result88, result89, 0.45) ||
      world.isCleared(result88, result89, `small`) ||
      world.isNearSpawn(result88, result89, 3)
    ) {
      continue;
    }
    let vegetationHash2dResult5 = vegetationHash2d(index19, 400, world.seed);
    let result90 = result87 ? Math.min(0.62, (0.05 + 0.13 * result86) * 4) : 0.07 * result86;
    let result91 = result87 ? 0.04 + 0.05 * result86 : 0.035 * result86;
    let result92 = result87 && !world.isNearTree(result88, result89, 1.4) ? 0.014 : 0;
    let result93 = vegetationHash2d(index19, 401, world.seed) * Math.PI * 2;
    let result94 = 0.8 + vegetationHash2d(index19, 402, world.seed) * 0.45;
    let setRGBResult3 = new THREE.Color().setRGB(
      0.92 + 0.1 * vegetationHash2d(index19, 403, world.seed),
      0.95 + 0.08 * vegetationHash2d(index19, 404, world.seed),
      0.9,
    );
    if (vegetationHash2dResult5 < result90) {
      world.register(
        world.fields[`fern` + (vegetationHash2d(index19, 405, world.seed) < 0.5 ? 0 : 1)].add(
          result88,
          world.ground.h[index19] - 0.02,
          result89,
          result93,
          result94,
          null,
          null,
          setRGBResult3,
        ),
        result88,
        result89,
      );
      world.fernCount++;
    } else if (vegetationHash2dResult5 < result90 + result91) {
      world.register(
        world.fields[`clover` + (vegetationHash2d(index19, 406, world.seed) < 0.6 ? 0 : 1)].add(
          result88,
          world.ground.h[index19] - 0.01,
          result89,
          result93,
          result94,
          null,
          null,
          setRGBResult3,
        ),
        result88,
        result89,
      );
      world.cloverCount++;
    } else if (vegetationHash2dResult5 < result90 + result91 + result92) {
      world.register(
        world.fields[`sapling` + (vegetationHash2d(index19, 407, world.seed) < 0.5 ? 0 : 1)].add(
          result88,
          world.ground.h[index19] - 0.02,
          result89,
          result93,
          result94,
          result94 * (0.9 + 0.3 * vegetationHash2d(index19, 408, world.seed)),
          result94,
          setRGBResult3,
        ),
        result88,
        result89,
      );
      world.saplingCount++;
    } else {
      continue;
    }
    world.occupied[index19] |= 32;
  }
}
