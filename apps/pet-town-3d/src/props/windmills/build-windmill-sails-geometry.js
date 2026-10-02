/** Windmill tower and separately animated sail geometry. */
import * as THREE from "three";
import { createBeveledPropCylinder } from "../geometry/create-beveled-prop-cylinder.js";
import { propsState } from "../state.js";
import { createBeveledPropBox } from "../geometry/create-beveled-prop-box.js";
export function buildWindmillSailsGeometry(values, value) {
  values.add(`wood`, createBeveledPropCylinder(0.34, 0.36, 12, 0.08), {
    rx: Math.PI / 2,
    z: -0.1,
    tint: propsState.propPalette.woodWarm,
    noAO: true,
    uv: {
      mode: `native`,
      su: 1,
      sv: 0.3,
    },
  });
  values.add(`metal`, new THREE.SphereGeometry(0.18, 10, 8), {
    z: 0.28,
    tint: propsState.propPalette.brass,
    noAO: true,
  });
  for (let index = 0; index < 4; index++) {
    values.push(0, 0, 0, 0, 0, (index * Math.PI) / 2 + 0.2);
    values.add(`wood`, createBeveledPropBox(0.2, 5.3, 0.16, 0.04), {
      y: 2.75,
      z: 0.08,
      tint: propsState.propPalette.woodWarm,
      noAO: true,
      uv: {
        grain: 1,
      },
    });
    for (let result of [0.2, 1.05]) {
      values.add(`wood`, createBeveledPropBox(0.08, 4, 0.08, 0.02), {
        x: result,
        y: 3.1,
        z: 0.05,
        tint: propsState.propPalette.woodLight,
        noAO: true,
        uv: {
          grain: 1,
        },
      });
    }
    for (let index2 = 0; index2 <= 8; index2++) {
      values.add(`wood`, createBeveledPropBox(1.05, 0.06, 0.06, 0.015), {
        x: 0.6,
        y: 1.1 + index2 * 0.5,
        z: 0.06,
        tint: propsState.propPalette.woodLight,
        noAO: true,
      });
    }
    values.add(`sail`, createBeveledPropBox(0.82, 3.8, 0.025, 0.01), {
      x: 0.63,
      y: 3.1,
      z: -0.01,
      noAO: true,
      tint: index % 2 ? 16775404 : 16773344,
      uv: {
        grain: 1,
        scale: 1 / 1.5,
      },
    });
    values.pop();
  }
}
