/** Prop lifecycle, collision and interaction API, terrain reseating, static batches and animated prop effects. */

import { samplePropFoundationHeight } from "./sample-prop-foundation-height.js";
export function configureSmallPropBuilder(build) {
  build.buildSmallProp = (value16, position9, value17, footValue = {}) => {
    position9.y = samplePropFoundationHeight(
      build.terrain,
      position9.x,
      position9.z,
      footValue.foot ?? 0.3,
      footValue.mode,
    );
    let callback2Result = build.beginRecord(value16, position9, {
      reseat: true,
      foot: footValue.foot ?? 0.3,
      mode: footValue.mode,
    });
    build.builder.begin(position9.x, position9.y, position9.z, position9.rot || 0, {
      aoH: 0.5,
      aoMin: footValue.aoMin ?? 0.6,
    });
    let result12 =
      value17(build.builder, build.random, {
        ...(position9.opts || {}),
        ...footValue,
      }) || {};
    let result13 = result12.radius ?? position9.r ?? 0.4;
    build.registerEntry(callback2Result, position9.type, result13);
    build.registerMetadata(callback2Result, {
      colliders: result12.colliders ?? [
        {
          x: 0,
          z: 0,
          radius: result13 * 0.85,
          h: 1,
          noTop: true,
        },
      ],
      walk: result12.walk,
    });
    if (footValue.shade) {
      build.registerShade(
        callback2Result,
        position9.x,
        position9.y + 0.03,
        position9.z,
        result13 * footValue.shade,
        result13 * footValue.shade,
        0,
        footValue.shadeA ?? 0.25,
      );
    }
    return result12;
  };
}
