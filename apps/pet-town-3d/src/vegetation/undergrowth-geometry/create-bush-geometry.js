/** Bushes, ferns, saplings, clover, mushrooms, reeds and fallen logs. */

import { mergeFoliageGeometry } from "../geometry-helpers/merge-foliage-geometry.js";
import { buildBushCanopy } from "./build-bush-canopy.js";
import { decorateBushCanopy } from "./decorate-bush-canopy.js";
export function createBushGeometry(random, settings = {}) {
  const bush = {
    random,
    settings,
  };
  buildBushCanopy(bush);
  decorateBushCanopy(bush);
  return {
    geo: mergeFoliageGeometry(bush.parts),
    lod: mergeFoliageGeometry(bush.lodParts),
    shadow: bush.shadow,
    fringe: bush.fringe,
    radius: bush.radius * 1.2,
    height: bush.radius * 1.25,
  };
}
