/** Windmill tower and separately animated sail geometry. */
import * as THREE from "three";
import { propsState } from "../state.js";
import { createBeveledPropBox } from "../geometry/create-beveled-prop-box.js";
import { extrudePropShape } from "../geometry/extrude-prop-shape.js";
import { createArchedPropShape } from "../geometry/create-arched-prop-shape.js";
import { appendLanternGeometry } from "../street-furniture/append-lantern-geometry.js";
export function buildWindmillDoor(windmill) {
  windmill.wallTilt = Math.atan2(0.6499999999999999, 6.2);
  windmill.wallFaceRadius = (value6) => windmill.radiusAtHeight(value6) * Math.cos(Math.PI / 8);
  windmill.builder.push(0, 0.66, windmill.wallFaceRadius(0.66) - 0.02, -windmill.wallTilt, 0, 0);
  windmill.builder.add(`paint`, extrudePropShape(createArchedPropShape(1, 1.95), 0.12, 0.02, 12), {
    z: 0.06,
    tint: propsState.propPalette.doorRed,
    uv: {
      grain: 1,
      scale: 1 / 1.6,
    },
  });
  windmill.doorFrame = createArchedPropShape(1.32, 2.1, 0.66);
  windmill.doorFrame.holes.push(createArchedPropShape(1, 1.95));
  windmill.builder.add(`paint`, extrudePropShape(windmill.doorFrame, 0.18, 0.03, 12), {
    z: 0.08,
    tint: propsState.propPalette.trim,
  });
  windmill.builder.add(`metal`, new THREE.SphereGeometry(0.055, 8, 6), {
    x: 0.3,
    y: 0.95,
    z: 0.17,
    tint: propsState.propPalette.brass,
  });
  windmill.builder.add(`metal`, createBeveledPropBox(0.06, 0.06, 0.42, 0.01), {
    y: 2.62,
    z: 0.24,
    tint: propsState.propPalette.iron,
  });
  windmill.builder.add(`metal`, createBeveledPropBox(0.03, 0.14, 0.03, 0.008), {
    y: 2.53,
    z: 0.42,
    tint: propsState.propPalette.iron,
  });
  appendLanternGeometry(windmill.builder, 0, 2.3, 0.42, 0.75);
  windmill.builder.pop();
  windmill.metadata.lights.push(
    new THREE.Vector3(
      0,
      2.96,
      windmill.wallFaceRadius(0.66) - 0.02 + 0.42 - 2.3 * Math.sin(windmill.wallTilt),
    ),
  );
}
