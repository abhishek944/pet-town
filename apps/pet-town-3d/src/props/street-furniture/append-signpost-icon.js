/** Lampposts, lanterns, benches, log seats, signposts, mailboxes, barrels, crates and sacks. */
import * as THREE from "three";
import { createBeveledPropBox } from "../geometry/create-beveled-prop-box.js";
import { extrudePropShape } from "../geometry/extrude-prop-shape.js";
export function appendSignpostIcon(values, value, value2, value3, value4) {
  values.push(value2, value3, value4);
  let result = 5913128;
  if (value === `house`) {
    values.add(`plain`, createBeveledPropBox(0.1, 0.08, 0.01, 0.004), {
      y: -0.02,
      tint: 15921386,
      noAO: true,
    });
    let shape = new THREE.Shape();
    shape.moveTo(-0.075, 0);
    shape.lineTo(0.075, 0);
    shape.lineTo(0, 0.065);
    shape.closePath();
    values.add(`plain`, extrudePropShape(shape, 0.012, 0), {
      y: 0.02,
      tint: 14178122,
      noAO: true,
    });
    values.add(`plain`, createBeveledPropBox(0.03, 0.045, 0.012, 0.003), {
      y: -0.035,
      z: 0.004,
      tint: result,
      noAO: true,
    });
  } else if (value === `sails`) {
    for (let result2 of [Math.PI / 4, -Math.PI / 4]) {
      values.add(`plain`, createBeveledPropBox(0.16, 0.022, 0.01, 0.004), {
        rz: result2,
        tint: result,
        noAO: true,
      });
    }
    values.add(`plain`, new THREE.CylinderGeometry(0.02, 0.02, 0.012, 10), {
      rx: Math.PI / 2,
      z: 0.004,
      tint: 14725200,
      noAO: true,
    });
  } else if (value === `wave`) {
    for (let [result3, result4] of [
      [-0.05, 0.02],
      [0.05, 0.02],
      [0, -0.03],
    ]) {
      values.add(`plain`, new THREE.TorusGeometry(0.035, 0.009, 4, 10, Math.PI), {
        x: result3,
        y: result4,
        tint: 4161456,
        noAO: true,
      });
    }
  } else {
    values.add(`plain`, new THREE.CylinderGeometry(0.045, 0.045, 0.012, 14), {
      rx: Math.PI / 2,
      tint: 14173242,
      noAO: true,
    });
    values.add(`plain`, createBeveledPropBox(0.01, 0.03, 0.01, 0.003), {
      y: 0.055,
      z: 0.003,
      tint: result,
      noAO: true,
    });
    values.add(`plain`, new THREE.CylinderGeometry(0.018, 0.018, 0.01, 8), {
      x: 0.025,
      y: 0.06,
      rx: Math.PI / 2,
      sx: 1.6,
      tint: 6989898,
      noAO: true,
    });
  }
  values.pop();
}
