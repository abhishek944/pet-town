/** Tree palettes, trunks, broadleaf crowns, fruit, pine tiers and palm fronds. */

import { mergeFoliageGeometry } from "../geometry-helpers/merge-foliage-geometry.js";
import { buildPalmTrunk } from "./build-palm-trunk.js";
import { buildPalmCrownBud } from "./build-palm-crown-bud.js";
import { buildPalmFronds } from "./build-palm-fronds.js";
import { buildPalmCoconuts } from "./build-palm-coconuts.js";
export function createPalmTreeGeometry(random, settings = {}) {
  const palm = {
    random,
    settings,
  };
  buildPalmTrunk(palm);
  buildPalmCrownBud(palm);
  buildPalmFronds(palm);
  buildPalmCoconuts(palm);
  return {
    trunk: palm.trunk,
    canopy: mergeFoliageGeometry(palm.crownParts),
    fringe: null,
    height: palm.height + 0.8,
    canopyRadius: 2.4,
    trunkRadius: 0.35,
    canopyCenter: palm.crownCenter.clone(),
    spheres: [
      {
        x: palm.crownCenter.x,
        y: palm.crownCenter.y - 0.3,
        z: palm.crownCenter.z,
        r: 1.9,
      },
    ],
  };
}
