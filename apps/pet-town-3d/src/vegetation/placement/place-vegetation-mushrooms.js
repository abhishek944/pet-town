/** Vegetation clearings, flower palettes and biome-aware world population. */
import * as THREE from "three";
import { vegetationState } from "../state.js";
import { vegetationHash2d } from "../random/vegetation-hash2d.js";
export function placeVegetationMushrooms(world) {
  world.mushroomKinds = [`mushRed`, `mushRed`, `mushBrown`, `mushTall`];
  world.mushroomColors = {
    mushRed: [`#e8413c`, `#f0553a`, `#d63a55`],
    mushBrown: [`#b07a4a`, `#c98d55`, `#9a6a40`],
    mushTall: [`#b58cff`, `#f2a0c8`, `#8fd0ff`],
  };
  world.mushroomCount = 0;
  world.mushroomBudget = Math.round(55 * world.areaScale);
  for (let result95 of vegetationState.vegetationRuntimeState.trees) {
    if (world.mushroomCount >= world.mushroomBudget) {
      break;
    }
    if (
      result95.type !== `oak` &&
      result95.type !== `oakDeep` &&
      result95.type !== `pine` &&
      result95.type !== `autumn`
    ) {
      continue;
    }
    let cell2 = result95.cell;
    if (vegetationHash2d(cell2, 31, world.seed) > 0.45) {
      continue;
    }
    let result96 = vegetationHash2d(cell2, 32, world.seed) * Math.PI * 2;
    let result97 = result95.radius + 0.35 + vegetationHash2d(cell2, 33, world.seed) * 0.6;
    let result98 = result95.position.x + Math.cos(result96) * result97;
    let result99 = result95.position.z + Math.sin(result96) * result97;
    let cellOfResult6 = world.ground.cellOf(result98, result99);
    if (
      cellOfResult6 < 0 ||
      !world.isLand(cellOfResult6) ||
      !world.isSoil(cellOfResult6) ||
      Math.abs(world.ground.h[cellOfResult6] - world.ground.h[cell2]) > 0.01 ||
      world.occupied[cellOfResult6] & 6 ||
      world.isCleared(result98, result99, `small`)
    ) {
      continue;
    }
    let result100 =
      world.mushroomKinds[
        Math.floor(vegetationHash2d(cell2, 34, world.seed) * world.mushroomKinds.length)
      ];
    let result101 =
      Math.floor(
        vegetationHash2d(cell2, 35, world.seed) *
          vegetationState.vegetationRuntimeState.lib[result100].length,
      ) % vegetationState.vegetationRuntimeState.lib[result100].length;
    let result102 =
      world.mushroomColors[result100][Math.floor(vegetationHash2d(cell2, 36, world.seed) * 3)];
    world.register(
      world.fields[result100 + result101].add(
        result98,
        world.ground.h[cellOfResult6] - 0.02,
        result99,
        result96,
        0.9 + vegetationHash2d(cell2, 37, world.seed) * 0.6,
        null,
        null,
        new THREE.Color(result102),
      ),
      result98,
      result99,
    );
    world.occupied[cellOfResult6] |= 8;
    world.mushroomCount++;
  }
  for (let index20 = 0; index20 < 600 && world.mushroomCount < world.mushroomBudget; index20++) {
    let result103 = Math.floor(world.random() * world.cellCount);
    if (
      !world.isLand(result103) ||
      world.occupied[result103] ||
      !world.isSoil(result103) ||
      (world.ground.biome[result103] !== vegetationState.vegetationBiomeIds.FOREST &&
        world.ground.biome[result103] !== vegetationState.vegetationBiomeIds.SWAMP)
    ) {
      continue;
    }
    let [callback11Result7, callback11Result8] = world.cellJitter(result103 + 5, 0.6);
    let result104 = world.cellX(result103) + callback11Result7;
    let result105 = world.cellZ(result103) + callback11Result8;
    if (world.isCleared(result104, result105, `small`)) {
      continue;
    }
    let result106 = world.mushroomKinds[Math.floor(world.random() * world.mushroomKinds.length)];
    world.register(
      world.fields[
        result106 +
          Math.floor(world.random() * vegetationState.vegetationRuntimeState.lib[result106].length)
      ].add(
        result104,
        world.ground.h[result103] - 0.02,
        result105,
        world.random() * 6.28,
        0.8 + world.random() * 0.5,
        null,
        null,
        new THREE.Color(world.mushroomColors[result106][Math.floor(world.random() * 3)]),
      ),
      result104,
      result105,
    );
    world.occupied[result103] |= 8;
    world.mushroomCount++;
  }
}
