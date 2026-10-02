/** Flower pots, produce piles, individual crops, raised garden beds, scarecrows and washing lines. */
import * as THREE from "three";
import { propsState } from "../state.js";
import { createNoisyPropRock } from "../geometry/create-noisy-prop-rock.js";
export function appendSunflowerGeometry(values, rangeValue, value, value2) {
  let rangeResult = rangeValue.range(1.1, 1.5);
  let rangeResult2 = rangeValue.range(0.25, 0.45);
  values.add(`leaf`, new THREE.CylinderGeometry(0.025, 0.035, rangeResult, 5), {
    x: value,
    y: rangeResult / 2,
    z: value2,
    tint: propsState.propPalette.leafDark,
  });
  for (let [result, result2] of [
    [0.45, 1],
    [0.8, -1],
  ]) {
    values.add(`leaf`, createNoisyPropRock(0.13, 1, 0.1, 2, rangeValue.next() * 9, 0.25), {
      x: value + result2 * 0.12,
      y: result * rangeResult,
      z: value2,
      rz: result2 * 0.4,
      tint: propsState.propPalette.leaf,
    });
  }
  values.push(value, rangeResult, value2, rangeResult2, 0, 0);
  values.add(`plain`, new THREE.CylinderGeometry(0.11, 0.11, 0.05, 14), {
    tint: 7028255,
    noAO: true,
    rx: Math.PI / 2,
    z: 0.03,
  });
  for (let index = 0; index < 13; index++) {
    let result3 = (index / 13) * propsState.propFullTurn;
    values.add(`plain`, new THREE.SphereGeometry(0.07, 6, 4), {
      x: Math.cos(result3) * 0.16,
      y: Math.sin(result3) * 0.16,
      z: 0.02,
      rz: result3,
      sx: 1.2,
      sy: 0.5,
      sz: 0.25,
      tint: propsState.propPalette.yellow,
      noAO: true,
    });
  }
  values.pop();
}
