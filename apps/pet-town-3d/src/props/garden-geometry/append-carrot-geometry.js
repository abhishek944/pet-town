/** Flower pots, produce piles, individual crops, raised garden beds, scarecrows and washing lines. */
import * as THREE from "three";
import { propsState } from "../state.js";
export function appendCarrotGeometry(addValue, nextValue, value, value2) {
  addValue.add(`plain`, new THREE.ConeGeometry(0.05, 0.08, 7), {
    x: value,
    y: 0.02,
    z: value2,
    rx: Math.PI,
    tint: propsState.propPalette.orange,
  });
  for (let index = 0; index < 4; index++) {
    let result = (index / 4) * propsState.propFullTurn + nextValue.next();
    addValue.add(`leaf`, new THREE.ConeGeometry(0.035, 0.3, 4), {
      x: value + Math.cos(result) * 0.04,
      y: 0.17,
      z: value2 + Math.sin(result) * 0.04,
      rx: Math.sin(result) * 0.35,
      rz: -Math.cos(result) * 0.35,
      tint: index & 1 ? propsState.propPalette.leaf : propsState.propPalette.leafLight,
    });
  }
}
