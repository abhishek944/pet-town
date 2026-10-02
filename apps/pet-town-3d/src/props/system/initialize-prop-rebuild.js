/** Prop lifecycle, collision and interaction API, terrain reseating, static batches and animated prop effects. */

import { propsState } from "../state.js";
import { disposeBuiltProps } from "./dispose-built-props.js";
import { createPropTerrainAdapter } from "../terrain-placement/create-prop-terrain-adapter.js";
import { planVillageProps } from "../village-layout/plan-village-props.js";
import { PropGeometryBuilder } from "../geometry-builder/prop-geometry-builder.js";
import { PropRandom } from "../math/prop-random.js";
export function initializePropRebuild(build) {
  build.context = propsState.propsRuntime.ctx;
  build.startedAt = performance.now();
  propsState.propsRuntime.rebuildIn = -1;
  disposeBuiltProps();
  build.terrain = createPropTerrainAdapter(build.context);
  if (build.replan || !propsState.propsRuntime.layout) {
    propsState.propsRuntime.layout = planVillageProps(build.context, build.terrain);
  }
  build.layout = propsState.propsRuntime.layout;
  propsState.propsApi.plaza = {
    ...build.layout.P,
  };
  build.builder = new PropGeometryBuilder(99);
  build.random = new PropRandom(4242);
  build.clearings = [];
  build.placementCount = 0;
  build.groundY = (value2, value3) => build.terrain.h(value2, value3) + 0.03;
}
