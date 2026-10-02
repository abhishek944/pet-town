/** Cupped petals, flower rings, bent stems and flower variants with levels of detail. */

import { createGrassBladeBuffers } from "../grass-geometry/create-grass-blade-buffers.js";
import { appendFoldedGrassBlade } from "../grass-geometry/append-folded-grass-blade.js";
import { mixFoliageRgb } from "../geometry-helpers/mix-foliage-rgb.js";
import { finalizeGrassBladeGeometry } from "../grass-geometry/finalize-grass-blade-geometry.js";
export function buildFlowerStemLeaves(flower) {
  if (flower.lod === 0) {
    let grassBladeBuffersResult = createGrassBladeBuffers();
    for (let index = 0; index < 2; index++) {
      appendFoldedGrassBlade(grassBladeBuffersResult, {
        ox: 0,
        oz: 0,
        dir: flower.leafAngles[index],
        h: 0.1,
        w: 0.035,
        lean: flower.leafLeans[index],
        segs: 1,
        fold: 0.6,
        upBase: 0.5,
        upTip: 0.3,
        colAt: (value3) => mixFoliageRgb(flower.stemDark, flower.stemLight, value3),
      });
    }
    flower.parts.push(finalizeGrassBladeGeometry(grassBladeBuffersResult, 0));
  }
}
