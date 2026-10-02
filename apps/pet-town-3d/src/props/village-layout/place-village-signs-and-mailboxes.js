/** Deterministic settlement layout, buildings, connecting footpaths, lamps, props and bridge site selection. */

import { propsState } from "../state.js";
import { transformPropGroundPoint } from "../terrain-placement/transform-prop-ground-point.js";
import { rotatePropGroundPoint } from "../terrain-placement/rotate-prop-ground-point.js";
import { getCottagePorchLayout } from "../cottages/get-cottage-porch-layout.js";
export function placeVillageSignsAndMailboxes(village) {
  {
    let result80 = village.windmill ? village.windmill.x : village.plaza.x + 5;
    let result81 = village.windmill ? village.windmill.z : village.plaza.z - 5;
    let result82 = Math.hypot(result80 - village.plaza.x, result81 - village.plaza.z) || 1;
    let result83 = (result80 - village.plaza.x) / result82;
    let result84 = (result81 - village.plaza.z) / result82;
    let filterResult = [
      [village.windmill, `sails`],
      [village.mainCottage, `house`],
      [
        village.bridge
          ? {
              x: village.bridge.mx,
              z: village.bridge.mz,
            }
          : null,
        `wave`,
      ],
      [village.stall, `apple`],
    ].filter(([value57]) => value57);
    for (let result85 of [1.3, -1.3, 2, -2]) {
      let result86 = village.plaza.x + result83 * 4.2 - result84 * result85;
      let result87 = village.plaza.z + result84 * 4.2 + result83 * result85;
      let atan2Result = Math.atan2(result83, result84);
      if (
        village.placeDecoration(`signpost`, result86, result87, atan2Result, 0.35, {
          arms: filterResult.slice(0, 3).map(([position16, value58]) => {
            let [rotatePropGroundPointResult, rotatePropGroundPointResult2] = rotatePropGroundPoint(
              position16.x - result86,
              position16.z - result87,
              -atan2Result,
            );
            return {
              a: Math.atan2(-rotatePropGroundPointResult2, rotatePropGroundPointResult),
              icon: value58,
            };
          }),
        })
      ) {
        break;
      }
    }
  }
  for (let [result88, result89] of [
    [village.mainCottage, 6268896],
    [village.cabin, 15231066],
  ]) {
    if (!result88) {
      continue;
    }
    let result90 = propsState.cottageVariants[result88.opts.variant];
    let cottagePorchLayoutResult = getCottagePorchLayout(result90);
    for (let [result91, result92] of [
      [cottagePorchLayoutResult.stepX + 2.4, cottagePorchLayoutResult.stepZ + 0.35],
      [cottagePorchLayoutResult.stepX - 2.4, cottagePorchLayoutResult.stepZ + 0.35],
      [cottagePorchLayoutResult.stepX + 1.6, cottagePorchLayoutResult.stepZ + 1.2],
      [cottagePorchLayoutResult.stepX - 1.6, cottagePorchLayoutResult.stepZ + 1.2],
    ]) {
      let [transformPropGroundPointResult7, transformPropGroundPointResult8] =
        transformPropGroundPoint(result88, result91, result92);
      if (
        village.placeDecoration(
          `mailbox`,
          transformPropGroundPointResult7,
          transformPropGroundPointResult8,
          result88.rot,
          0.3,
          {
            tint: result89,
          },
          `cottage`,
          0.5,
        )
      ) {
        break;
      }
    }
  }
}
