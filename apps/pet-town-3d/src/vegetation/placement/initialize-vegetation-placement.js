/** Vegetation clearings, flower palettes and biome-aware world population. */

import { vegetationState } from "../state.js";
import { createVegetationRandom } from "../random/create-vegetation-random.js";
import { registerVegetationItemCell } from "../assets/register-vegetation-item-cell.js";
import { createVegetationClearingPredicate } from "./create-vegetation-clearing-predicate.js";
import { collectVegetationClearings } from "./collect-vegetation-clearings.js";
import { clampVegetationValue } from "../random/clamp-vegetation-value.js";
export function initializeVegetationPlacement(world) {
  world.ground = vegetationState.vegetationRuntimeState.ground;
  world.seed = vegetationState.vegetationRuntimeState.seed;
  world.fields = vegetationState.vegetationRuntimeState.fields;
  world.cellCount = world.ground.nx * world.ground.nz;
  world.waterLevel = Number.isFinite(world.ground.waterLevel) ? world.ground.waterLevel : -1 / 0;
  world.random = createVegetationRandom(world.seed);
  world.occupied = new Uint8Array(world.cellCount);
  vegetationState.vegetationRuntimeState.registry = new Map();
  world.register = registerVegetationItemCell;
  world.isCleared = createVegetationClearingPredicate(collectVegetationClearings());
  world.isLand = (value) =>
    world.ground.valid[value] &&
    Number.isNaN(world.ground.water[value]) &&
    world.ground.h[value] > world.waterLevel + 0.12;
  world.landCount = 0;
  for (let index14 = 0; index14 < world.cellCount; index14++) {
    if (world.isLand(index14)) {
      world.landCount++;
    }
  }
  world.areaScale = clampVegetationValue(world.landCount / 7e3, 0.35, 2.4);
}
