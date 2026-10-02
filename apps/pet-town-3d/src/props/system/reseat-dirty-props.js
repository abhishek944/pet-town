/** Prop lifecycle, collision and interaction API, terrain reseating, static batches and animated prop effects. */
import { propsState } from "../state.js";
import { createPropTerrainAdapter } from "../terrain-placement/create-prop-terrain-adapter.js";
import { reseatPropRecord } from "./reseat-prop-record.js";
import { updatePropGroundEffectBatches } from "./update-prop-ground-effect-batches.js";
export function reseatDirtyProps() {
  if (!propsState.propsRuntime.dirty.size) {
    return;
  }
  let propTerrainAdapterResult = createPropTerrainAdapter(propsState.propsRuntime.ctx);
  let result = performance.now();
  let index = 0;
  for (let result2 of propsState.propsRuntime.dirty) {
    if (reseatPropRecord(result2, propTerrainAdapterResult)) {
      index++;
    }
  }
  propsState.propsRuntime.dirty.clear();
  if (index) {
    updatePropGroundEffectBatches();
  }
  if (index && propsState.propsRuntime.ctx.params?.has?.(`propsDebugLog`)) {
    console.info(
      `[props] re-seated ${index} prop(s) in ${(performance.now() - result).toFixed(2)}ms`,
    );
  }
}
