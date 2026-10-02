/** Detailed market stall geometry and decorative flat leaf geometry. */
import * as THREE from "three";
import { createBeveledPropBox } from "../geometry/create-beveled-prop-box.js";
import { propsState } from "../state.js";
import { appendProducePileGeometry } from "../garden-geometry/append-produce-pile-geometry.js";
import { appendLanternGeometry } from "../street-furniture/append-lantern-geometry.js";
export function stockMarketProduce(stall) {
  [`apple`, `orange`, `melon`].forEach((value, value2) => {
    let result17 = -3.3 / 2 + 0.6 + (value2 * 2.0999999999999996) / 2;
    let result18 = 0.85;
    let result19 = 0.62;
    stall.builder.push(result17, 1.02, 0.55, -0.05, stall.random.range(-0.08, 0.08), 0);
    stall.builder.add(`wood`, createBeveledPropBox(result18, 0.05, result19, 0.015), {
      y: 0.025,
      tint: propsState.propPalette.woodLight,
    });
    for (let result20 of [-1, 1]) {
      stall.builder.add(`wood`, createBeveledPropBox(result18, 0.18, 0.05, 0.015), {
        y: 0.09,
        z: result20 * (result19 / 2 - 0.025),
        tint: propsState.propPalette.woodLight,
      });
      stall.builder.add(`wood`, createBeveledPropBox(0.05, 0.2, result19, 0.015), {
        x: result20 * (result18 / 2 - 0.025),
        y: 0.1,
        tint: propsState.propPalette.woodWarm,
      });
    }
    stall.builder.push(0, 0.03, 0);
    appendProducePileGeometry(stall.builder, stall.random, 0.73, 0.5, value);
    stall.builder.pop();
    stall.builder.pop();
  });
  stall.builder.add(`metal`, createBeveledPropBox(0.03, 0.3, 0.03, 0.008), {
    x: -3.3 / 2 + 0.35,
    y: 2.0500000000000003,
    z: 0.9500000000000001,
    tint: propsState.propPalette.iron,
  });
  appendLanternGeometry(stall.builder, -3.3 / 2 + 0.35, 1.73, 0.9500000000000001, 0.7);
  stall.metadata.lights.push(new THREE.Vector3(-3.3 / 2 + 0.35, 1.73, 0.9500000000000001));
}
