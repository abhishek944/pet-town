/** Lampposts, lanterns, benches, log seats, signposts, mailboxes, barrels, crates and sacks. */
import * as THREE from "three";
import { createPropLathe } from "../geometry/create-prop-lathe.js";
import { propsState } from "../state.js";
export function buildBarrelProp(addValue, value, hValue = {}) {
  let result = hValue.h ?? 0.95;
  let result2 = hValue.r ?? 0.36;
  let values = [
    [0, 0.02],
    [result2 * 0.84, 0],
    [result2 * 0.93, result * 0.14],
    [result2, result * 0.5],
    [result2 * 0.93, result * 0.86],
    [result2 * 0.84, result],
    [result2 * 0.78, result - 0.01],
    [result2 * 0.78, result - 0.05],
    [0, result - 0.05],
  ];
  addValue.add(`wood`, createPropLathe(values, 16), {
    tint: hValue.tint ?? propsState.propPalette.woodWarm,
    jitter: 0.06,
    uv: {
      mode: `native`,
      su: 0.6,
      sv: (propsState.propFullTurn * result2) / 2,
      swap: true,
    },
  });
  for (let result3 of [0.14, 0.34, 0.66, 0.86]) {
    let result4 = result2 * (1 - 0.16 * (Math.abs(result3 - 0.5) * 2) ** 1.6) + 0.012;
    addValue.add(
      `metal`,
      createPropLathe(
        [
          [result4 - 0.02, 0],
          [result4, 0.005],
          [result4, 0.045],
          [result4 - 0.02, 0.05],
        ],
        16,
      ),
      {
        y: result3 * result - 0.025,
        tint: propsState.propPalette.iron,
      },
    );
  }
  if (hValue.water) {
    addValue.add(`plain`, new THREE.CircleGeometry(result2 * 0.76, 16), {
      y: result - 0.08,
      rx: -Math.PI / 2,
      tint: 4095904,
      noAO: true,
    });
  }
  return {
    radius: result2 + 0.05,
    colliders: [
      {
        x: 0,
        z: 0,
        radius: result2 + 0.03,
        h: result,
      },
    ],
  };
}
