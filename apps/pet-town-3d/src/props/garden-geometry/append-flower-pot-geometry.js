/** Flower pots, produce piles, individual crops, raised garden beds, scarecrows and washing lines. */
import * as THREE from "three";
import { createPropLathe } from "../geometry/create-prop-lathe.js";
import { propsState } from "../state.js";
import { createNoisyPropRock } from "../geometry/create-noisy-prop-rock.js";
export function appendFlowerPotGeometry(addValue, nextValue, value, value2, value3, rValue = {}) {
  let result = rValue.r ?? 0.22;
  let result2 = result * 1.7;
  addValue.add(
    `plain`,
    createPropLathe(
      [
        [0, 0],
        [result * 0.72, 0],
        [result * 0.92, result2 * 0.86],
        [result * 1.06, result2 * 0.88],
        [result * 1.06, result2],
        [result * 0.85, result2],
        [result * 0.85, result2 * 0.92],
        [0, result2 * 0.92],
      ],
      14,
    ),
    {
      x: value,
      y: value2,
      z: value3,
      tint: propsState.propPalette.terracotta,
      jitter: 0.05,
    },
  );
  addValue.add(`soil`, new THREE.CircleGeometry(result * 0.84, 12), {
    x: value,
    y: value2 + result2 * 0.93,
    z: value3,
    rx: -Math.PI / 2,
  });
  addValue.add(`leaf`, createNoisyPropRock(result * 1.15, 2, 0.28, 3, nextValue.next() * 9, 0.85), {
    x: value,
    y: value2 + result2 + result * 0.75,
    z: value3,
    tint: nextValue.chance(0.5) ? propsState.propPalette.leaf : 6069316,
  });
  let result3 = rValue.flowers ?? propsState.propPalette.pink;
  for (let index = 0; index < 9; index++) {
    let result4 = nextValue.next() * propsState.propFullTurn;
    let rangeResult = nextValue.range(0.2, 1.2);
    let result5 = result * 1.3;
    addValue.add(`plain`, new THREE.SphereGeometry(result * 0.2, 6, 4), {
      x: value + Math.cos(result4) * result5 * Math.cos(rangeResult),
      y: value2 + result2 + result * 0.75 + Math.sin(rangeResult) * result5 * 0.9,
      z: value3 + Math.sin(result4) * result5 * Math.cos(rangeResult),
      sy: 0.7,
      tint: index % 4 ? result3 : 16777215,
      noAO: true,
    });
  }
}
