/** Folded grass blades, tuft levels of detail and dune grass geometry. */
import { createGrassBladeBuffers } from "./create-grass-blade-buffers.js";
import { foliageColorToRgb } from "../geometry-helpers/foliage-color-to-rgb.js";
import { vegetationState } from "../state.js";
import { appendFoldedGrassBlade } from "./append-folded-grass-blade.js";
import { mixFoliageRgb } from "../geometry-helpers/mix-foliage-rgb.js";
import { finalizeGrassBladeGeometry } from "./finalize-grass-blade-geometry.js";
export function createDuneGrassGeometry(value) {
  let grassBladeBuffersResult = createGrassBladeBuffers();
  let foliageColorToRgbResult = foliageColorToRgb(`#8a9444`);
  let foliageColorToRgbResult2 = foliageColorToRgb(`#b9b863`);
  let foliageColorToRgbResult3 = foliageColorToRgb(`#eee0a0`);
  for (let index = 0; index < 12; index++) {
    let result = value() * vegetationState.foliageFullTurn;
    let result2 = 0.16 * Math.sqrt(value());
    appendFoldedGrassBlade(grassBladeBuffersResult, {
      ox: Math.cos(result) * result2,
      oz: Math.sin(result) * result2,
      dir: result + (value() - 0.5),
      h: 0.45 + value() * 0.4,
      w: 0.035 + value() * 0.02,
      lean: 0.5 + value() * 0.6,
      segs: 3,
      fold: 0.5,
      colAt: (value2) =>
        value2 < 0.5
          ? mixFoliageRgb(foliageColorToRgbResult, foliageColorToRgbResult2, value2 / 0.5)
          : mixFoliageRgb(foliageColorToRgbResult2, foliageColorToRgbResult3, (value2 - 0.5) / 0.5),
    });
  }
  return finalizeGrassBladeGeometry(grassBladeBuffersResult, 0);
}
