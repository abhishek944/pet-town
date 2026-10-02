/** Lampposts, lanterns, benches, log seats, signposts, mailboxes, barrels, crates and sacks. */
import * as THREE from "three";
import { createBeveledPropBox } from "../geometry/create-beveled-prop-box.js";
import { propsState } from "../state.js";
import { createBeveledPropCylinder } from "../geometry/create-beveled-prop-cylinder.js";
export function appendLanternGeometry(values, value, value2, value3, value4 = 1) {
  values.push(value, value2, value3, 0, 0, 0, value4);
  values.add(`metal`, createBeveledPropBox(0.34, 0.06, 0.34, 0.02), {
    y: -0.22,
    tint: propsState.propPalette.iron,
  });
  values.add(`lamp`, createBeveledPropBox(0.26, 0.36, 0.26, 0.02), {
    tint: 16777215,
    noAO: true,
  });
  for (let [result, result2] of [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ]) {
    values.add(`metal`, createBeveledPropBox(0.045, 0.42, 0.045, 0.01), {
      x: result * 0.14,
      z: result2 * 0.14,
      tint: propsState.propPalette.iron,
    });
  }
  for (let index = 0; index < 4; index++) {
    let result3 = (index * Math.PI) / 2;
    values.push(Math.sin(result3) * 0.132, 0, Math.cos(result3) * 0.132, 0, result3, 0);
    values.add(`metal`, createBeveledPropBox(0.022, 0.36, 0.012, 0.004), {
      tint: propsState.propPalette.iron,
    });
    values.add(`metal`, createBeveledPropBox(0.26, 0.022, 0.012, 0.004), {
      y: 0.03,
      tint: propsState.propPalette.iron,
    });
    values.pop();
  }
  values.add(`plain`, createBeveledPropCylinder(0.035, 0.09, 8, 0.01), {
    y: -0.19,
    tint: 16774882,
  });
  values.add(`metal`, new THREE.ConeGeometry(0.29, 0.2, 4, 1), {
    y: 0.3,
    ry: Math.PI / 4,
    tint: propsState.propPalette.iron,
  });
  values.add(`metal`, createBeveledPropBox(0.34, 0.05, 0.34, 0.015), {
    y: 0.21,
    tint: propsState.propPalette.iron,
  });
  values.add(`metal`, new THREE.SphereGeometry(0.045, 8, 6), {
    y: 0.43,
    tint: propsState.propPalette.brass,
  });
  values.pop();
}
