/** Prop lifecycle, collision and interaction API, terrain reseating, static batches and animated prop effects. */
import { propsState } from "../state.js";
import { createPropTerrainAdapter } from "../terrain-placement/create-prop-terrain-adapter.js";
export function pollPropsTerrainHeights() {
  if (!propsState.propsRuntime.recs.size || propsState.propsRuntime.rebuildIn >= 0) {
    return;
  }
  let propTerrainAdapterResult = createPropTerrainAdapter(propsState.propsRuntime.ctx);
  let index = 0;
  let index2 = 0;
  for (let position of propsState.propsRuntime.recs.values()) {
    if (position.kind !== `stone`) {
      index2++;
      if (Math.abs(propTerrainAdapterResult.h(position.x, position.z) - position.h0) > 0.01) {
        index++;
        if (position.reseat) {
          propsState.propsRuntime.dirty.add(position);
        }
      }
    }
  }
  if (index > index2 * 0.3) {
    propsState.propsRuntime.dirty.clear();
    propsState.propsRuntime.rebuildIn = 0.3;
  } else {
    if (propsState.propsRuntime.dirty.size && propsState.propsRuntime.dirtyIn < 0) {
      propsState.propsRuntime.dirtyIn = 0.05;
    }
  }
}
