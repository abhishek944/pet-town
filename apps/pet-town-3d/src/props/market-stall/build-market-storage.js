/** Detailed market stall geometry and decorative flat leaf geometry. */

import { appendProducePileGeometry } from "../garden-geometry/append-produce-pile-geometry.js";
import { buildBarrelProp } from "../street-furniture/build-barrel-prop.js";
import { buildCrateProp } from "../street-furniture/build-crate-prop.js";
export function buildMarketStorage(stall) {
  stall.builder.push(-3.3 / 2 - 0.55, 0, 0.35);
  buildBarrelProp(stall.builder, stall.random, {});
  stall.builder.pop();
  stall.builder.push(-3.3 / 2 - 0.5, 0, -0.55);
  buildCrateProp(stall.builder, stall.random, {
    s: 0.66,
    ry: 0.2,
  });
  stall.builder.pop();
  stall.builder.push(-3.3 / 2 - 0.45, 0.66, -0.55);
  buildCrateProp(stall.builder, stall.random, {
    s: 0.5,
    ry: -0.3,
  });
  stall.builder.pop();
  stall.builder.push(2.15, 0, -0.5);
  buildCrateProp(stall.builder, stall.random, {
    s: 0.7,
    ry: 0.1,
  });
  stall.builder.pop();
  stall.builder.push(2.15, 0.7, -0.5);
  appendProducePileGeometry(stall.builder, stall.random, 0.55, 0.55, `apple`);
  stall.builder.pop();
}
