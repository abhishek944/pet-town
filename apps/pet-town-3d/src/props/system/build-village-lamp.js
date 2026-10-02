/** Prop lifecycle, collision and interaction API, terrain reseating, static batches and animated prop effects. */

import { propsState } from "../state.js";
import { buildLamppostProp } from "../street-furniture/build-lamppost-prop.js";
export function buildVillageLamp(build, placement, tag) {
  let callback8Result = build.buildSmallProp(tag, placement, buildLamppostProp, {
    shade: 3,
    shadeA: 0.25,
  });
  let result18 = propsState.propsRuntime.recs.get(tag);
  build.registerMetadata(result18, {
    lights: [callback8Result.light],
  });
  result18.pools.at(-1)[3] = result18.pools.at(-1)[4] = 7;
  result18.pools.at(-1)[6] = 0.55;
}
