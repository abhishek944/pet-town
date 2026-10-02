/** Vegetation clearings, flower palettes and biome-aware world population. */
import * as THREE from "three";
import { vegetationState } from "../state.js";
import { vegetationHash2d } from "../random/vegetation-hash2d.js";
export function placeVegetationBushes(world) {
  for (let result71 of world.bushCandidates) {
    if (world.bushPositions.length >= world.bushBudget) {
      break;
    }
    let i3 = result71.i;
    let [callback11Result3, callback11Result4] = world.cellJitter(i3 + 999, 0.3);
    let result72 = world.cellX(i3) + callback11Result3;
    let result73 = world.cellZ(i3) + callback11Result4;
    let result74 = world.ground.h[i3];
    if (
      world.isNearTree(result72, result73, 0.9) ||
      world.isCleared(result72, result73, `small`) ||
      world.isNearPath(result72, result73, 1.2)
    ) {
      continue;
    }
    let enabled = false;
    for (let result84 of world.bushPositions) {
      if (Math.hypot(result84[0] - result72, result84[1] - result73) < 2) {
        enabled = true;
        break;
      }
    }
    if (enabled) {
      continue;
    }
    let vegetationHash2dResult4 = vegetationHash2d(i3, 23, world.seed);
    let result75 =
      vegetationHash2dResult4 < 0.14
        ? `berryRed`
        : vegetationHash2dResult4 < 0.21
          ? `berryBlue`
          : vegetationHash2dResult4 < 0.29
            ? `blossomBush`
            : `bush`;
    let result76 =
      Math.floor(
        vegetationHash2d(i3, 24, world.seed) *
          vegetationState.vegetationRuntimeState.lib[result75].length,
      ) % vegetationState.vegetationRuntimeState.lib[result75].length;
    let result77 = vegetationState.vegetationRuntimeState.lib[result75][result76];
    let result78 = 0.8 + vegetationHash2d(i3, 25, world.seed) * 0.45;
    let result79 = vegetationHash2d(i3, 26, world.seed) * Math.PI * 2;
    let result80 = result78 * (0.9 + vegetationHash2d(i3, 28, world.seed) * 0.2);
    let result81 = 0.9 + vegetationHash2d(i3, 27, world.seed) * 0.18;
    let setRGBResult2 = new THREE.Color().setRGB(result81 * 1.02, result81, result81 * 0.96);
    let result82 = world.fields[result75 + result76].add(
      result72,
      result74 - 0.05,
      result73,
      result79,
      result78,
      result80,
      result78,
      setRGBResult2,
    );
    result82.proxyGeos = [result77.lod];
    result82.shadowGeos = [result77.shadow || result77.lod];
    result82.tint = setRGBResult2;
    world.register(result82, result72, result73);
    if (world.fields[`${result75}${result76}_fringe`]) {
      world.register(
        world.fields[`${result75}${result76}_fringe`].add(
          result72,
          result74 - 0.05,
          result73,
          result79,
          result78,
          result80,
          result78,
          setRGBResult2,
        ),
        result72,
        result73,
      );
    }
    let callback6Result2 = world.distanceToLedge(i3, 2);
    let result83 = Math.min(result77.radius * result78 * 1.1, callback6Result2);
    if (result83 >= 0.7) {
      world.register(
        world.fields.blob.add(
          result72,
          result74 + 0.012,
          result73,
          result79,
          result83 * 2,
          1,
          result83 * 2,
          null,
        ),
        result72,
        result73,
      );
    }
    world.bushPositions.push([result72, result73]);
    world.occupied[i3] |= 2;
  }
}
