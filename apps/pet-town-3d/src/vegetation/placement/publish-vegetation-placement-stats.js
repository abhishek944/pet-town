/** Vegetation clearings, flower palettes and biome-aware world population. */

import { vegetationState } from "../state.js";
export function publishVegetationPlacementStats(world) {
  vegetationState.vegetationRuntimeState.stats = {
    trees: vegetationState.vegetationRuntimeState.trees.length,
    colliders: vegetationState.vegetationRuntimeState.colliders.length,
    logs: world.logCount,
    bushes: world.bushPositions.length,
    mushrooms: world.mushroomCount,
    grass: world.grassCount,
    tallGrass: world.tallGrassCount,
    flowers: world.flowerCount,
    dune: world.duneGrassCount,
    reeds: world.reedCount,
    lilies: world.lilyCount,
    ferns: world.fernCount,
    clover: world.cloverCount,
    saplings: world.saplingCount,
    blockMode: world.ground.blockMode,
    cells: world.cellCount,
    landCells: world.landCount,
    groundSampled: !!world.ground.ground?.cell,
  };
}
