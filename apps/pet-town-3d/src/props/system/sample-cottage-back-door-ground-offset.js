/** Prop lifecycle, collision and interaction API, terrain reseating, static batches and animated prop effects. */
import { transformPropLocalPoint } from "./transform-prop-local-point.js";
export function sampleCottageBackDoorGroundOffset(hValue, yValue, DValue) {
  let transformPropLocalPointResult = transformPropLocalPoint(yValue, 0, 0, -DValue.D / 2 - 0.8);
  return hValue.h(transformPropLocalPointResult.x, transformPropLocalPointResult.z) - yValue.y;
}
