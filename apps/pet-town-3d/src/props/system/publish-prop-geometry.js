/** Prop lifecycle, collision and interaction API, terrain reseating, static batches and animated prop effects. */

import { setPropRecordVisible } from "./set-prop-record-visible.js";
import { propsState } from "../state.js";
import { updatePropGroundEffectBatches } from "./update-prop-ground-effect-batches.js";
import { registerPropRoofSurfaces } from "./register-prop-roof-surfaces.js";
export function publishPropGeometry(build) {
  registerPropRoofSurfaces(build);
  build.staticGroup = build.builder.build(propsState.propsRuntime.mats);
  build.staticGroup.name = `props_static`;
  propsState.propsRuntime.group.add(build.staticGroup);
  propsState.propsRuntime.statics.push(build.staticGroup);
  propsState.propsRuntime.ranges = build.staticGroup.userData.ranges;
  // Keep unsupported authored records available after reload, so restoring the
  // terrain reveals the same object without regenerating the entire village.
  for (const record of propsState.propsRuntime.recs.values()) {
    if (record.it.supportValid === false) {
      setPropRecordVisible(record, false);
    }
  }
  propsState.propsRuntime.pool.setSources(propsState.propsRuntime.halos);
  updatePropGroundEffectBatches();
}
