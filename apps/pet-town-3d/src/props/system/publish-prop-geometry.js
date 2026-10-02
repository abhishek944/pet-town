/** Prop lifecycle, collision and interaction API, terrain reseating, static batches and animated prop effects. */

import { propsState } from "../state.js";
import { updatePropGroundEffectBatches } from "./update-prop-ground-effect-batches.js";
export function publishPropGeometry(build) {
  build.staticGroup = build.builder.build(propsState.propsRuntime.mats);
  build.staticGroup.name = `props_static`;
  propsState.propsRuntime.group.add(build.staticGroup);
  propsState.propsRuntime.statics.push(build.staticGroup);
  propsState.propsRuntime.ranges = build.staticGroup.userData.ranges;
  propsState.propsRuntime.pool.setSources(propsState.propsRuntime.halos);
  updatePropGroundEffectBatches();
}
