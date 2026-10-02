/** Flower pots, produce piles, individual crops, raised garden beds, scarecrows and washing lines. */
import * as THREE from "three";
import { varyPropColor } from "./vary-prop-color.js";
import { propsState } from "../state.js";
import { createBeveledPropCylinder } from "../geometry/create-beveled-prop-cylinder.js";
import { createNoisyPropRock } from "../geometry/create-noisy-prop-rock.js";
export function appendPumpkinGeometry(addValue, value, value2, value3, value4 = 0.24) {
  let sphereGeometry = new THREE.SphereGeometry(value4, 18, 12);
  let position2 = sphereGeometry.attributes.position;
  for (let index = 0; index < position2.count; index++) {
    let xResult = position2.getX(index);
    let yResult = position2.getY(index);
    let zResult = position2.getZ(index);
    let result = 1 - 0.09 * Math.abs(Math.sin(Math.atan2(zResult, xResult) * 4)) ** 0.6;
    position2.setXYZ(index, xResult * result, yResult * 0.72, zResult * result);
  }
  sphereGeometry.computeVertexNormals();
  addValue.add(`plain`, sphereGeometry, {
    x: value2,
    y: value4 * 0.68,
    z: value3,
    tint: varyPropColor(value, propsState.propPalette.orange),
  });
  addValue.add(`wood`, createBeveledPropCylinder(0.035, 0.12, 6, 0.01), {
    x: value2,
    y: value4 * 1.3,
    z: value3,
    rz: 0.3,
    tint: 7178810,
  });
  addValue.add(`leaf`, createNoisyPropRock(0.12, 1, 0.15, 3, 4, 0.2), {
    x: value2 + value4 * 0.9,
    y: 0.03,
    z: value3,
    tint: propsState.propPalette.leaf,
  });
}
