/** Detailed market stall geometry and decorative flat leaf geometry. */
import * as THREE from "three";
import { propsState } from "../state.js";
import { createBeveledPropCylinder } from "../geometry/create-beveled-prop-cylinder.js";
import { clonePropColor } from "../geometry-builder/clone-prop-color.js";
export function buildMarketShelves(stall) {
  stall.jarColors = [16754237, 14173242, 9396176, 7781727, 16764735];
  stall.lidColors = [15226699, 15921126, 6989784];
  for (let [result10, result11] of [
    [1.29, 9],
    [0.59, 7],
  ]) {
    for (let index = 0; index < result11; index++) {
      let result12 = -1.25 + (index * 2.5) / (result11 - 1);
      let result13 = stall.jarColors[(index + (result10 < 1 ? 2 : 0)) % 5];
      let rangeResult = stall.random.range(0.2, 0.27);
      let rangeResult2 = stall.random.range(0.085, 0.105);
      stall.builder.add(`plain`, createBeveledPropCylinder(rangeResult2, rangeResult, 12, 0.03), {
        x: result12,
        y: result10,
        z: -1.8 / 2 + 0.3 + stall.random.range(-0.05, 0.05),
        tint: clonePropColor(result13).multiplyScalar(stall.random.range(0.9, 1.05)),
      });
      stall.builder.add(
        `paint`,
        createBeveledPropCylinder(rangeResult2 + 0.006, rangeResult * 0.36, 12, 0.005),
        {
          x: result12,
          y: result10 + rangeResult * 0.3,
          z: -1.8 / 2 + 0.3,
          tint: 16511967,
          uv: {
            mode: `native`,
            su: 1,
            sv: 0.2,
          },
        },
      );
      stall.builder.add(
        `plain`,
        new THREE.SphereGeometry(
          rangeResult2 + 0.025,
          12,
          6,
          0,
          propsState.buildingFullTurn,
          0,
          Math.PI / 2,
        ),
        {
          x: result12,
          y: result10 + rangeResult - 0.01,
          z: -1.8 / 2 + 0.3,
          sy: 0.45,
          tint: stall.lidColors[index % 3],
        },
      );
      stall.builder.add(`plain`, new THREE.TorusGeometry(rangeResult2 + 0.01, 0.01, 4, 12), {
        x: result12,
        y: result10 + rangeResult - 0.03,
        z: -1.8 / 2 + 0.3,
        rx: Math.PI / 2,
        tint: 13214814,
        noAO: true,
      });
    }
  }
}
