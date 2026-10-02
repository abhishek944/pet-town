/** Cupped petals, flower rings, bent stems and flower variants with levels of detail. */

import { mergeFoliageGeometry } from "../geometry-helpers/merge-foliage-geometry.js";
import { configureFlowerModel } from "./configure-flower-model.js";
import { buildFlowerStemLeaves } from "./build-flower-stem-leaves.js";
import { buildFlowerBloom } from "./build-flower-bloom.js";
export function createFlowerGeometry(random, kind, settings = {}) {
  const flower = {
    random,
    kind,
    settings,
  };
  configureFlowerModel(flower);
  buildFlowerStemLeaves(flower);
  buildFlowerBloom(flower);
  return mergeFoliageGeometry(flower.parts);
}
