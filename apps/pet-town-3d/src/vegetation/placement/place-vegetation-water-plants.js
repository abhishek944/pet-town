/** Vegetation clearings, flower palettes and biome-aware world population. */
import * as THREE from "three";
import { vegetationState } from "../state.js";
import { vegetationFractalNoise2d } from "../random/vegetation-fractal-noise2d.js";
import { vegetationHash2d } from "../random/vegetation-hash2d.js";
import { vegetationSmoothstep } from "../random/vegetation-smoothstep.js";
export function placeVegetationWaterPlants(world) {
  world.reedCount = 0;
  world.lilyCount = 0;
  world.lilySites = [];
  if (Number.isFinite(world.waterLevel)) {
    for (let index28 = 0; index28 < world.cellCount; index28++) {
      if (!world.ground.valid[index28]) {
        continue;
      }
      let callback2Result6 = world.cellX(index28);
      let callback3Result6 = world.cellZ(index28);
      let vegetationFractalNoise2dResult6 = vegetationFractalNoise2d(
        callback2Result6 * 0.13 + 400,
        callback3Result6 * 0.13,
        world.seed + 17,
      );
      if (Number.isNaN(world.ground.water[index28])) {
        if (
          world.ground.shore[index28] === 1 &&
          !world.isNearOcean(index28, 3) &&
          world.ground.h[index28] <= world.waterLevel + 1.6 &&
          world.ground.top[index28] !== vegetationState.vegetationSurfaceIds.STONE &&
          !(world.occupied[index28] & 7) &&
          vegetationHash2d(index28, 300, world.seed) <
            0.75 * vegetationSmoothstep(0.42, 0.62, vegetationFractalNoise2dResult6)
        ) {
          let [callback11Result13, callback11Result14] = world.cellJitter(index28 + 77, 0.5);
          if (
            world.isCleared(
              callback2Result6 + callback11Result13,
              callback3Result6 + callback11Result14,
              `small`,
            )
          ) {
            continue;
          }
          world.register(
            world.fields[`reeds` + (vegetationHash2d(index28, 301, world.seed) < 0.5 ? 0 : 1)].add(
              callback2Result6 + callback11Result13,
              world.ground.h[index28] - 0.03,
              callback3Result6 + callback11Result14,
              vegetationHash2d(index28, 302, world.seed) * 6.28,
              0.85 + vegetationHash2d(index28, 303, world.seed) * 0.4,
              null,
              null,
              null,
            ),
            callback2Result6,
            callback3Result6,
          );
          world.reedCount++;
        }
      } else {
        if (world.ground.ocean[index28] || world.isNearOcean(index28, 3)) {
          continue;
        }
        let result153 = world.ground.water[index28] - world.ground.h[index28];
        if (
          world.ground.landDist[index28] === 1 &&
          result153 <= 0.7 &&
          vegetationHash2d(index28, 310, world.seed) <
            0.6 * vegetationSmoothstep(0.45, 0.64, vegetationFractalNoise2dResult6)
        ) {
          let [callback11Result15, callback11Result16] = world.cellJitter(index28 + 78, 0.4);
          let result154 = Math.max(0.9, (result153 + 0.8) / 1.2);
          world.register(
            world.fields[`reeds` + (vegetationHash2d(index28, 311, world.seed) < 0.5 ? 0 : 1)].add(
              callback2Result6 + callback11Result15,
              world.ground.h[index28] - 0.03,
              callback3Result6 + callback11Result16,
              vegetationHash2d(index28, 312, world.seed) * 6.28,
              result154,
              null,
              null,
              null,
            ),
            callback2Result6,
            callback3Result6,
          );
          world.reedCount++;
        }
        if (
          world.ground.waterTag[index28] !== 3 &&
          world.ground.wide[index28] &&
          world.ground.landDist[index28] >= 1 &&
          world.ground.landDist[index28] <= 5 &&
          result153 >= 0.3 &&
          vegetationHash2d(index28, 320, world.seed) <
            0.14 + 0.5 * vegetationSmoothstep(0.45, 0.65, vegetationFractalNoise2dResult6)
        ) {
          let [callback11Result17, callback11Result18] = world.cellJitter(index28 + 79, 0.6);
          let result155 = callback2Result6 + callback11Result17;
          let result156 = callback3Result6 + callback11Result18;
          let result157 = 0.6 + vegetationHash2d(index28, 325, world.seed) * 0.8;
          let result158 = vegetationHash2d(index28, 321, world.seed) < 0.25;
          let vegetationHash2dResult6 = vegetationHash2d(index28, 322, world.seed);
          let result159 = result158
            ? vegetationHash2dResult6 < 0.6
              ? 0
              : 1
            : vegetationHash2dResult6 < 0.45
              ? 0
              : vegetationHash2dResult6 < 0.8
                ? 1
                : 2;
          let result160 = (result158 ? `lilyF` : `lily`) + result159;
          let result161 =
            (result158
              ? vegetationState.vegetationRuntimeState.lib.lilyFExt
              : vegetationState.vegetationRuntimeState.lib.lilyExt)[result159] * result157;
          let enabled2 = false;
          for (let result164 of world.lilySites) {
            if (
              Math.hypot(result164[0] - result155, result164[1] - result156) <
              result161 + result164[2] + 0.08
            ) {
              enabled2 = true;
              break;
            }
          }
          if (enabled2) {
            continue;
          }
          let result162 = result158
            ? new THREE.Color(
                [`#ff9ccf`, `#fff2f6`, `#ffc4de`, `#f7a8c8`][
                  Math.floor(vegetationHash2d(index28, 323, world.seed) * 4)
                ],
              )
            : null;
          let result163 = world.fields[result160].add(
            result155,
            world.ground.waterSurface() + 0.05,
            result156,
            vegetationHash2d(index28, 324, world.seed) * 6.28,
            result157,
            1,
            null,
            result162,
          );
          world.register(result163, result155, result156);
          vegetationState.vegetationRuntimeState.floaters.push(result163);
          world.lilySites.push([result155, result156, result161]);
          world.lilyCount++;
        }
      }
    }
  }
}
