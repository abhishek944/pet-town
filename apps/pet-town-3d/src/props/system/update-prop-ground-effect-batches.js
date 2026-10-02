/** Prop lifecycle, collision and interaction API, terrain reseating, static batches and animated prop effects. */
import * as THREE from "three";
import { propsState } from "../state.js";
export function updatePropGroundEffectBatches() {
  let batches2 = propsState.propsRuntime.batches;
  let color = new THREE.Color();
  batches2.pools.begin();
  for (let [result, result2, result3, result4, result5, result6, result7, result8] of propsState
    .propsRuntime.pools) {
    color.set(result8 ?? 16757850);
    batches2.pools.push(
      result,
      result2,
      result3,
      result4,
      result5,
      color.r,
      color.g,
      color.b,
      result7,
      result6,
    );
  }
  batches2.pools.commit();
  batches2.pools.amp = propsState.propsRuntime.night;
  batches2.shade.begin();
  for (let [result9, result10, result11, result12, result13, result14, result15] of propsState
    .propsRuntime.shade) {
    batches2.shade.push(
      result9,
      result10,
      result11,
      result12,
      result13,
      0.05,
      0.04,
      0.03,
      result15,
      result14,
    );
  }
  batches2.shade.commit();
  batches2.shade.amp = 1;
}
