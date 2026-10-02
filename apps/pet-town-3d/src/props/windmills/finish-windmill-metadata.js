/** Windmill tower and separately animated sail geometry. */
import * as THREE from "three";
import { propsState } from "../state.js";
import { createBeveledPropCylinder } from "../geometry/create-beveled-prop-cylinder.js";
export function finishWindmillMetadata(windmill) {
  windmill.hubHeight = 7.55;
  windmill.builder.add(`wood`, createBeveledPropCylinder(0.28, 1.1, 10, 0.05), {
    y: windmill.hubHeight,
    z: 0.8499999999999999,
    rx: Math.PI / 2,
    tint: propsState.propPalette.woodDark,
    uv: {
      mode: `native`,
      su: 1,
      sv: 0.5,
      swap: true,
    },
  });
  windmill.metadata.colliders.push(
    {
      x: 0,
      z: 0,
      radius: 2.42,
      y0: -windmill.foundationDepth,
      h: 0.66 + windmill.foundationDepth,
      noTop: true,
    },
    {
      x: 0,
      z: 0,
      radius: 1.95,
      y0: 0.6,
      h: 9,
      noTop: true,
    },
  );
  Object.assign(windmill.metadata, {
    hub: new THREE.Vector3(0, windmill.hubHeight, 2),
    radius: 2.5,
    height: 9.2,
  });
}
