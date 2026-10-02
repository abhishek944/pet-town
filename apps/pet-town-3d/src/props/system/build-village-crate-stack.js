/** Prop lifecycle, collision and interaction API, terrain reseating, static batches and animated prop effects. */

import { buildBarrelProp } from "../street-furniture/build-barrel-prop.js";
import { buildCrateProp } from "../street-furniture/build-crate-prop.js";
export function buildVillageCrateStack(build, placement, tag) {
  build.buildSmallProp(
    tag,
    placement,
    (values6, value19) => {
      buildCrateProp(values6, value19, {
        s: 0.72,
      });
      values6.push(0.05, 0.72, 0.02);
      buildCrateProp(values6, value19, {
        s: 0.56,
        ry: 0.35,
      });
      values6.pop();
      values6.push(0.75, 0, 0.1);
      buildBarrelProp(values6, value19, {
        h: 0.8,
        r: 0.3,
      });
      values6.pop();
      return {
        radius: 0.9,
        colliders: [
          {
            x: 0,
            z: 0,
            w: 0.72,
            d: 0.72,
            radius: 0.5,
            h: 0.72,
          },
          {
            x: 0.05,
            z: 0.02,
            radius: 0.3,
            y0: 0.72,
            h: 0.56,
          },
          {
            x: 0.75,
            z: 0.1,
            radius: 0.33,
            h: 0.8,
          },
        ],
      };
    },
    {
      foot: 0.5,
      shade: 2,
      shadeA: 0.22,
    },
  );
}
