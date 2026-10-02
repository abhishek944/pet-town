/** Prop lifecycle, collision and interaction API, terrain reseating, static batches and animated prop effects. */
import { propsState } from "../state.js";
export function samplePropWalkHeight(value, value2) {
  let result = null;
  for (let position of propsState.propsRuntime.walk) {
    if (
      Math.abs(value - position.x) <= position.hx &&
      Math.abs(value2 - position.z) <= position.hz &&
      (result === null || position.y > result)
    ) {
      result = position.y;
    }
  }
  return result;
}
