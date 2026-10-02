/** Terrain footprint sampling, cardinal orientation and cottage/windmill entrance access. */
import { transformPropGroundPoint } from "./transform-prop-ground-point.js";
import { propsState } from "../state.js";
export function sampleWindmillEntranceTerrain(hValue, yValue) {
  let result = -1 / 0;
  for (let result2 of [0.6, 1.3, 2.1, 2.8, 3.5]) {
    for (let result3 of [-0.7, 0, 0.7]) {
      let [transformPropGroundPointResult3, transformPropGroundPointResult4] =
        transformPropGroundPoint(yValue, result3, propsState.windmillFrontOffset + result2);
      result = Math.max(
        result,
        hValue.h(transformPropGroundPointResult3, transformPropGroundPointResult4),
      );
    }
  }
  let [transformPropGroundPointResult, transformPropGroundPointResult2] = transformPropGroundPoint(
    yValue,
    0,
    2.8000000000000003,
  );
  return {
    hi: result - yValue.y,
    near: hValue.h(transformPropGroundPointResult, transformPropGroundPointResult2) - yValue.y,
  };
}
