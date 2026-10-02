/** Lily pad palettes, veined pads and flowering lily clusters. */
import { vegetationState } from "../state.js";
import { createLilyPadGeometry } from "./create-lily-pad-geometry.js";
import { createRadialPetalRing } from "../flower-geometry/create-radial-petal-ring.js";
import { shadeFlowerPetals } from "../flower-geometry/shade-flower-petals.js";
import { createNoisyFlowerCenter } from "../flower-geometry/create-noisy-flower-center.js";
import { bakeFoliageVertexAttributes } from "../geometry-helpers/bake-foliage-vertex-attributes.js";
import { mixFoliageRgb } from "../geometry-helpers/mix-foliage-rgb.js";
import { foliageColorToRgb } from "../geometry-helpers/foliage-color-to-rgb.js";
import { clampFoliageUnit } from "../geometry-helpers/clamp-foliage-unit.js";
import { mergeFoliageGeometry } from "../geometry-helpers/merge-foliage-geometry.js";
export function createLilyClusterGeometry(value, padsValue = {}) {
  let values = [];
  let result = padsValue.pads ?? 1;
  let result2 = vegetationState.lilyPadPalettes[padsValue.palette ?? 0];
  for (let index = 0; index < result; index++) {
    let result3 = index === 0 ? 0.42 : 0.24 + value() * 0.1;
    let result4 =
      (index / Math.max(1, result - 1)) * vegetationState.foliageFullTurn * 0.9 + value() * 0.8;
    let result5 = index === 0 ? 0 : Math.cos(result4) * 0.72;
    let result6 = index === 0 ? 0 : Math.sin(result4) * 0.72;
    values.push(
      createLilyPadGeometry(
        value,
        result3,
        result5,
        result6,
        index === 0 ? result2 : vegetationState.lilyPadPalettes[Math.floor(value() * 2)],
      ),
    );
  }
  if (padsValue.flower) {
    let radialPetalRingResult = createRadialPetalRing(
      10,
      0.17,
      0.05,
      0.02,
      0.12,
      {
        cupL: 0.25,
        cupW: 0.5,
        curl: 0,
        widths: [0.46, 1, 0.8],
      },
      value,
    );
    let radialPetalRingResult2 = createRadialPetalRing(
      8,
      0.13,
      0.045,
      0.012,
      0.55,
      {
        cupL: 0.35,
        cupW: 0.6,
        curl: 0,
        widths: [0.46, 1, 0.8],
      },
      value,
    );
    radialPetalRingResult2.forEach((rotateYValue) => rotateYValue.rotateY(0.3));
    for (let result7 of shadeFlowerPetals(
      [...radialPetalRingResult, ...radialPetalRingResult2],
      0.72,
      0.2,
    )) {
      result7.translate(0.05, 0.05, 0.02);
      values.push(result7);
    }
    let noisyFlowerCenterResult = createNoisyFlowerCenter(0.03, 0.7, 11);
    noisyFlowerCenterResult.translate(0.05, 0.075, 0.02);
    values.push(
      bakeFoliageVertexAttributes(noisyFlowerCenterResult, (value2, yValue) => ({
        c: mixFoliageRgb(
          foliageColorToRgb(`#d99a20`),
          foliageColorToRgb(`#ffd23a`),
          clampFoliageUnit(yValue.y * 0.6 + 0.4),
        ),
        s: 0.2,
        t: 0,
      })),
    );
  }
  return mergeFoliageGeometry(values);
}
