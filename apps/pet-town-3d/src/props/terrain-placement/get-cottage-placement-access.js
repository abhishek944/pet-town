/** Terrain footprint sampling, cardinal orientation and cottage/windmill entrance access. */
import { propsState } from "../state.js";
import { getCottagePorchLayout } from "../cottages/get-cottage-porch-layout.js";
import { transformPropGroundPoint } from "./transform-prop-ground-point.js";
import { getStairLayout } from "../cottages/get-stair-layout.js";
export function getCottagePlacementAccess(hValue, optsValue) {
  let result =
    propsState.cottageVariants[optsValue.opts?.variant ?? `main`] ??
    propsState.cottageVariants.main;
  let cottagePorchLayoutResult = getCottagePorchLayout(result);
  let [transformPropGroundPointResult, transformPropGroundPointResult2] = transformPropGroundPoint(
    optsValue,
    cottagePorchLayoutResult.stepX,
    cottagePorchLayoutResult.stepZ + 0.45,
  );
  let result2 =
    hValue.h(transformPropGroundPointResult, transformPropGroundPointResult2) - optsValue.y;
  let stairLayoutResult = getStairLayout(cottagePorchLayoutResult.F, Math.min(0, result2));
  return {
    v: result,
    P: cottagePorchLayoutResult,
    frontGround: result2,
    front: transformPropGroundPoint(
      optsValue,
      cottagePorchLayoutResult.stepX,
      cottagePorchLayoutResult.stepZ + stairLayoutResult.n * stairLayoutResult.depth + 0.6,
    ),
    porch: transformPropGroundPoint(
      optsValue,
      cottagePorchLayoutResult.cx,
      cottagePorchLayoutResult.pz0 + cottagePorchLayoutResult.pd / 2,
    ),
    porchR: Math.max(cottagePorchLayoutResult.pw, cottagePorchLayoutResult.pd) / 2 + 0.2,
  };
}
