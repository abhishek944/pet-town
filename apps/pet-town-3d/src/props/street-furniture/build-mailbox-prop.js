/** Lampposts, lanterns, benches, log seats, signposts, mailboxes, barrels, crates and sacks. */
import * as THREE from "three";
import { createBeveledPropBox } from "../geometry/create-beveled-prop-box.js";
import { propsState } from "../state.js";
import { clonePropColor } from "../geometry-builder/clone-prop-color.js";
export function buildMailboxProp(addValue, value, tintValue = {}) {
  let result = tintValue.tint ?? 6268896;
  addValue.add(`wood`, createBeveledPropBox(0.13, 1.05, 0.13, 0.03), {
    y: 0.52,
    tint: propsState.propPalette.woodDark,
    uv: {
      grain: 1,
    },
  });
  addValue.add(`wood`, createBeveledPropBox(0.34, 0.06, 0.62, 0.02), {
    y: 1.07,
    tint: propsState.propPalette.woodWarm,
  });
  addValue.add(`plain`, createBeveledPropBox(0.34, 0.22, 0.56, 0.03), {
    y: 1.21,
    tint: result,
  });
  addValue.add(
    `plain`,
    new THREE.CylinderGeometry(0.17, 0.17, 0.56, 14, 1, false, Math.PI / 2, Math.PI),
    {
      y: 1.32,
      rx: Math.PI / 2,
      tint: result,
    },
  );
  addValue.add(
    `plain`,
    new THREE.CylinderGeometry(0.155, 0.155, 0.03, 14, 1, false, Math.PI / 2, Math.PI),
    {
      y: 1.32,
      z: 0.285,
      rx: Math.PI / 2,
      tint: clonePropColor(result).multiplyScalar(0.8),
    },
  );
  addValue.add(`plain`, createBeveledPropBox(0.31, 0.2, 0.03, 0.01), {
    y: 1.2,
    z: 0.285,
    tint: clonePropColor(result).multiplyScalar(0.8),
  });
  addValue.add(`metal`, new THREE.SphereGeometry(0.03, 6, 4), {
    y: 1.3,
    z: 0.31,
    tint: propsState.propPalette.brass,
  });
  addValue.add(`metal`, createBeveledPropBox(0.025, 0.36, 0.025, 0.008), {
    x: 0.19,
    y: 1.36,
    z: -0.05,
    tint: propsState.propPalette.iron,
  });
  addValue.add(`plain`, createBeveledPropBox(0.02, 0.12, 0.17, 0.008), {
    x: 0.2,
    y: 1.48,
    z: 0.03,
    tint: propsState.propPalette.red,
  });
  addValue.add(`sail`, createBeveledPropBox(0.2, 0.012, 0.14, 0.004), {
    y: 1.28,
    z: 0.3,
    rx: 0.5,
    tint: 16644332,
  });
  return {
    radius: 0.3,
    colliders: [
      {
        x: 0,
        z: 0,
        radius: 0.2,
        h: 1.45,
        noTop: true,
      },
    ],
  };
}
