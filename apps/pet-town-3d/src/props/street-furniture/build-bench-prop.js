/** Lampposts, lanterns, benches, log seats, signposts, mailboxes, barrels, crates and sacks. */
import * as THREE from "three";
import { propsState } from "../state.js";
import { createBeveledPropBox } from "../geometry/create-beveled-prop-box.js";
export function buildBenchProp(addValue, rangeValue, wValue = {}) {
  let result = wValue.w ?? 1.7;
  let result2 = wValue.tint ?? propsState.propPalette.woodWarm;
  let timber2 = propsState.propPalette.timber;
  for (let [result3] of [
    [-0.14, 0],
    [0.12, 1],
  ]) {
    addValue.add(
      `wood`,
      createBeveledPropBox(result + rangeValue.range(-0.04, 0.04), 0.09, 0.25, 0.035),
      {
        y: 0.47,
        z: result3,
        ry: rangeValue.range(-0.015, 0.015),
        tint: result2,
        jitter: 0.07,
        uv: {
          grain: 0,
        },
      },
    );
  }
  addValue.add(`wood`, createBeveledPropBox(result, 0.2, 0.08, 0.035), {
    y: 0.84,
    z: -0.31,
    rx: -0.14,
    tint: result2,
    jitter: 0.06,
    uv: {
      grain: 0,
    },
  });
  for (let result5 of [-1, 1]) {
    let result6 = result5 * (result / 2 - 0.2);
    for (let result7 of [0.15, -0.2]) {
      addValue.add(`wood`, createBeveledPropBox(0.12, 0.44, 0.12, 0.03), {
        x: result6,
        y: 0.21,
        z: result7,
        rz: result5 * 0.08,
        tint: timber2,
        uv: {
          grain: 1,
        },
      });
    }
    addValue.add(`wood`, createBeveledPropBox(0.1, 0.1, 0.52, 0.03), {
      x: result6,
      y: 0.36,
      z: -0.02,
      tint: timber2,
    });
    addValue.add(`wood`, createBeveledPropBox(0.1, 0.62, 0.1, 0.03), {
      x: result6,
      y: 0.62,
      z: -0.3,
      rx: -0.14,
      tint: timber2,
      uv: {
        grain: 1,
      },
    });
    for (let result8 of [-1, 1]) {
      addValue.add(`metal`, new THREE.SphereGeometry(0.018, 5, 4), {
        x: result6 + result8 * 0.25,
        y: 0.52,
        z: 0.12,
        tint: propsState.propPalette.iron,
        noAO: true,
      });
    }
  }
  return {
    radius: result / 2 + 0.1,
    colliders: [
      {
        x: 0,
        z: 0.02,
        w: result,
        d: 0.5,
        radius: result / 2,
        h: 0.5,
      },
      {
        x: 0,
        z: -0.3,
        w: result,
        d: 0.14,
        radius: result / 2,
        h: 1.05,
        noTop: true,
      },
    ],
  };
}
