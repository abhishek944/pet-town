/** Flower pots, produce piles, individual crops, raised garden beds, scarecrows and washing lines. */
import * as THREE from "three";
import { propsState } from "../state.js";
export function appendGardenFlowerGeometry(addValue, rangeValue, value, value2, hValue = {}) {
  let result = hValue.h ?? rangeValue.range(0.18, 0.32);
  let result2 =
    hValue.color ??
    rangeValue.pick([
      propsState.propPalette.pink,
      propsState.propPalette.yellow,
      16777215,
      propsState.propPalette.lilac,
      16743019,
    ]);
  let result3 = hValue.y ?? 0;
  addValue.add(`leaf`, new THREE.CylinderGeometry(0.012, 0.016, result, 4), {
    x: value,
    y: result3 + result / 2,
    z: value2,
    tint: propsState.propPalette.leafDark,
  });
  for (let index = 0; index < 5; index++) {
    let result4 = (index / 5) * propsState.propFullTurn + rangeValue.next();
    addValue.add(`plain`, new THREE.SphereGeometry(0.035, 6, 4), {
      x: value + Math.cos(result4) * 0.04,
      y: result3 + result,
      z: value2 + Math.sin(result4) * 0.04,
      sy: 0.45,
      tint: result2,
      noAO: true,
    });
  }
  addValue.add(`plain`, new THREE.SphereGeometry(0.028, 6, 4), {
    x: value,
    y: result3 + result + 0.012,
    z: value2,
    tint: result2 === propsState.propPalette.yellow ? 12607530 : propsState.propPalette.yellow,
    noAO: true,
  });
}
