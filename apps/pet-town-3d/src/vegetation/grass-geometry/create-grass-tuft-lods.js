/** Folded grass blades, tuft levels of detail and dune grass geometry. */
import { vegetationState } from "../state.js";
import { createGrassBladeBuffers } from "./create-grass-blade-buffers.js";
import { appendFoldedGrassBlade } from "./append-folded-grass-blade.js";
import { foliageSmoothstep } from "../geometry-helpers/foliage-smoothstep.js";
import { multiplyFoliageRgb } from "../geometry-helpers/multiply-foliage-rgb.js";
import { finalizeGrassBladeGeometry } from "./finalize-grass-blade-geometry.js";
export function createGrassTuftLods(value, value2 = {}) {
  let {
    blades: value2Value = 14,
    hMin: value2Value2 = 0.22,
    hMax: value2Value3 = 0.42,
    wMin: value2Value4 = 0.045,
    wMax: value2Value5 = 0.07,
    spread: value2Value6 = 0.16,
    lean: value2Value7 = 0.5,
    segs: value2Value8 = 2,
    tipMul: value2Value9 = [1.14, 1.12, 0.9],
    contact: value2Value10 = 0.74,
    fold: value2Value11 = 0.4,
    splay: value2Value12 = 1,
  } = value2;
  let values = [];
  for (let index = 0; index < value2Value; index++) {
    let result = value() * vegetationState.foliageFullTurn;
    let result2 = value2Value6 * Math.sqrt(value());
    let result3 =
      (result2 > 0.02 ? result : value() * vegetationState.foliageFullTurn) +
      (value() - 0.5) * 1.1 * value2Value12;
    let result4 = value2Value2 + (value2Value3 - value2Value2) * value() ** 0.8;
    let result5 = value2Value4 + (value2Value5 - value2Value4) * value();
    let result6 =
      value2Value7 *
      (0.3 + 0.9 * value()) *
      (0.6 + (0.8 * result2) / Math.max(value2Value6, 0.001));
    values.push({
      ox: Math.cos(result) * result2,
      oz: Math.sin(result) * result2,
      dir: result3,
      h: result4,
      w: result5,
      L: result6,
      shade: 0.93 + value() * 0.14,
      twist: (value() - 0.5) * 0.8,
      pri: value() + result4 / value2Value3,
    });
  }
  let sortResult = values.slice().sort((priValue, priValue2) => priValue2.pri - priValue.pri);
  let callback = (value3, value4, value5, value6) => {
    let grassBladeBuffersResult = createGrassBladeBuffers();
    for (let result7 of value3) {
      appendFoldedGrassBlade(grassBladeBuffersResult, {
        ox: result7.ox,
        oz: result7.oz,
        dir: result7.dir,
        h: result7.h,
        w: result7.w * value4,
        lean: result7.L,
        segs: value5,
        fold: value6,
        twist: result7.twist,
        colAt: (value7) => {
          let result8 =
            value7 < 0.4
              ? value2Value10 + (1 - value2Value10) * foliageSmoothstep(0, 0.4, value7)
              : 1;
          let foliageSmoothstepResult = foliageSmoothstep(0.4, 1, value7);
          return multiplyFoliageRgb(
            [
              result8 * (1 + (value2Value9[0] - 1) * foliageSmoothstepResult),
              result8 * (1 + (value2Value9[1] - 1) * foliageSmoothstepResult),
              result8 * (1 + (value2Value9[2] - 1) * foliageSmoothstepResult),
            ],
            result7.shade,
          );
        },
      });
    }
    return finalizeGrassBladeGeometry(grassBladeBuffersResult, 1);
  };
  return [
    callback(values, 1, value2Value8, value2Value11),
    callback(
      sortResult.slice(0, Math.max(3, Math.round(value2Value * 0.42))),
      1.55,
      1,
      value2Value11 * 0.7,
    ),
    callback(sortResult.slice(0, Math.max(2, Math.round(value2Value * 0.24))), 2.1, 1, 0.3),
  ];
}
