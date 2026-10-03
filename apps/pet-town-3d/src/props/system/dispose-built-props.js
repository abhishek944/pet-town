/** Prop lifecycle, collision and interaction API, terrain reseating, static batches and animated prop effects. */
import { propsState } from "../state.js";
import { disposePropEmitter } from "../effects/dispose-prop-emitter.js";
export function disposeBuiltProps() {
  for (let result of propsState.propsRuntime.statics) {
    result.traverse((geometryValue) => geometryValue.geometry?.dispose());
    result.removeFromParent();
  }
  propsState.propsRuntime.statics = [];
  propsState.propsRuntime.smokes = [];
  const fires = new Set(propsState.propsRuntime.fires);
  for (const record of propsState.propsRuntime.recs.values()) {
    for (const fire of record.fires ?? []) fires.add(fire);
  }
  for (let result2 of fires) {
    disposePropEmitter(result2);
  }
  propsState.propsRuntime.fires = [];
  if (propsState.propsRuntime.fireLight) {
    propsState.propsRuntime.fireLight.intensity = 0;
  }
  for (let result3 of propsState.propsRuntime.blades) {
    result3.traverse((geometryValue2) => geometryValue2.geometry?.dispose());
    result3.parent?.removeFromParent();
  }
  propsState.propsRuntime.blades = [];
  propsState.propsRuntime.halos = [];
  propsState.propsRuntime.walk = [];
  propsState.propsRuntime.pools = [];
  propsState.propsRuntime.shade = [];
  propsState.propsRuntime.recs = new Map();
  propsState.propsRuntime.dirty.clear();
  propsState.propsRuntime.ranges = null;
  propsState.propColliders.length = 0;
  propsState.propEntries.length = 0;
}
