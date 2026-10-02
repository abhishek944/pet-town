/** Prop lifecycle, collision and interaction API, terrain reseating, static batches and animated prop effects. */

import { buildMarketStallProp } from "../market-stall/build-market-stall-prop.js";
export function buildVillageStall(build, placement, tag) {
  let callback2Result4 = build.beginRecord(tag, placement);
  build.builder.begin(placement.x, placement.y, placement.z, placement.rot, {
    aoH: 0.8,
    aoMin: 0.65,
  });
  let marketStallPropResult = buildMarketStallProp(build.builder, build.random, {});
  build.registerEntry(callback2Result4, `Market stall`, 2);
  build.registerMetadata(callback2Result4, marketStallPropResult);
  build.registerShade(
    callback2Result4,
    placement.x,
    placement.y + 0.03,
    placement.z,
    4.6,
    3.4,
    -(placement.rot || 0),
    0.22,
  );
}
