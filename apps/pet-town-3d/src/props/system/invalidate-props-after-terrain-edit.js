/** Prop lifecycle, collision and interaction API, terrain reseating, static batches and animated prop effects. */
import { propsState } from "../state.js";
export function invalidatePropsAfterTerrainEdit(position) {
  let x2 = position?.x;
  let z2 = position?.z;
  if (!(Number.isFinite(x2) && Number.isFinite(z2))) {
    propsState.propsRuntime.rebuildIn = 0.6;
    return;
  }
  let result = x2 + 0.5;
  let result2 = z2 + 0.5;
  let enabled = false;
  for (let position2 of propsState.propsRuntime.recs.values()) {
    if (
      position2.reseat &&
      (position2.kind === `stone`
        ? Math.max(Math.abs(position2.x - result), Math.abs(position2.z - result2)) - 0.9
        : Math.hypot(position2.x - result, position2.z - result2) - (position2.foot + 0.75)) < 0
    ) {
      propsState.propsRuntime.dirty.add(position2);
      enabled = true;
    }
  }
  if (enabled && propsState.propsRuntime.dirtyIn < 0) {
    propsState.propsRuntime.dirtyIn = 0.25;
  }
}
