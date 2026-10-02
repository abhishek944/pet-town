/** Detailed market stall geometry and decorative flat leaf geometry. */
import * as THREE from "three";
import { createBeveledPropBox } from "../geometry/create-beveled-prop-box.js";
import { propsState } from "../state.js";
import { createFlatLeafGeometry } from "./create-flat-leaf-geometry.js";
export function buildMarketSign(stall) {
  stall.builder.push(2.2, 0, 1.1, 0, -0.4, 0);
  for (let result21 of [-1, 1]) {
    stall.builder.add(`wood`, createBeveledPropBox(0.6, 0.85, 0.05, 0.02), {
      y: 0.45,
      z: result21 * 0.14,
      rx: -result21 * 0.18,
      tint: propsState.propPalette.woodWarm,
    });
    stall.builder.add(`plain`, createBeveledPropBox(0.48, 0.62, 0.02, 0.01), {
      y: 0.47,
      z: result21 * 0.17,
      rx: -result21 * 0.18,
      tint: 3425854,
    });
  }
  stall.builder.push(0, 0.47, 0.185, -0.18, 0, 0);
  stall.chalkColor = 15986662;
  stall.builder.add(`plain`, new THREE.TorusGeometry(0.06, 0.009, 4, 16), {
    x: -0.12,
    y: 0.16,
    tint: 15305600,
    noAO: true,
  });
  stall.builder.add(`plain`, createBeveledPropBox(0.012, 0.045, 0.006, 0.002), {
    x: -0.12,
    y: 0.235,
    tint: stall.chalkColor,
    noAO: true,
  });
  stall.builder.add(`plain`, createFlatLeafGeometry(), {
    x: -0.1,
    y: 0.24,
    sx: 0.35,
    sy: 0.35,
    sz: 0.2,
    rz: -0.8,
    tint: 10473610,
    noAO: true,
  });
  for (let index3 = 0; index3 < 4; index3++) {
    let rangeResult3 = stall.random.range(0.1, 0.2);
    stall.builder.add(`plain`, createBeveledPropBox(rangeResult3, 0.014, 0.006, 0.002), {
      x: 0.02 + rangeResult3 / 2,
      y: 0.2 - index3 * 0.07,
      tint: stall.chalkColor,
      noAO: true,
    });
  }
  for (let index4 = 0; index4 < 3; index4++) {
    stall.builder.add(`plain`, createBeveledPropBox(0.05, 0.014, 0.006, 0.002), {
      x: -0.14 + index4 * 0.1,
      y: -0.08,
      rz: 0.4 * (index4 - 1),
      tint: stall.chalkColor,
      noAO: true,
    });
  }
  stall.builder.add(`plain`, new THREE.TorusGeometry(0.03, 0.007, 4, 10), {
    x: 0.14,
    y: -0.18,
    tint: 16171866,
    noAO: true,
  });
  stall.builder.add(`plain`, createBeveledPropBox(0.3, 0.012, 0.006, 0.002), {
    x: 0,
    y: -0.24,
    tint: stall.chalkColor,
    noAO: true,
  });
  stall.builder.pop();
  stall.builder.pop();
}
