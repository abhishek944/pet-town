/** Lampposts, lanterns, benches, log seats, signposts, mailboxes, barrels, crates and sacks. */
import * as THREE from "three";
import { createNoisyPropRock } from "../geometry/create-noisy-prop-rock.js";
import { propsState } from "../state.js";
import { createBeveledPropBox } from "../geometry/create-beveled-prop-box.js";
import { createPropPostCap } from "./create-prop-post-cap.js";
import { extrudePropShape } from "../geometry/extrude-prop-shape.js";
import { appendSignpostIcon } from "./append-signpost-icon.js";
export function buildSignpostProp(values, value, armsValue = {}) {
  let result = armsValue.arms ?? [
    {
      a: 0.3,
      icon: `sails`,
    },
    {
      a: 2.4,
      icon: `house`,
    },
    {
      a: -1.4,
      icon: `apple`,
    },
  ];
  values.add(`stone`, createNoisyPropRock(0.32, 2, 0.18, 2, 3, 0.5), {
    y: 0.02,
    tint: propsState.propPalette.stoneDark,
    down: 0.9,
  });
  values.add(`wood`, createBeveledPropBox(0.17, 2.3, 0.17, 0.04), {
    y: 1.15,
    tint: propsState.propPalette.bark,
    uv: {
      grain: 1,
    },
  });
  values.add(`wood`, createPropPostCap(0.12, 0.16), {
    y: 2.3,
    tint: propsState.propPalette.woodDark,
  });
  let values2 = [14726787, 14262374, 13209434];
  let values3 = [6963240, 5912098, 5123612];
  result.forEach(({ a: value2, icon: value3 }, value4) => {
    let result2 = 2 - value4 * 0.36;
    let result3 = 1.05 - value4 * 0.08;
    let result4 = value4 % 2 ? -1 : 1;
    let shape = new THREE.Shape();
    shape.moveTo(-0.02, -0.13);
    shape.lineTo(result3 - 0.2, -0.13);
    shape.quadraticCurveTo(result3 - 0.12, -0.1, result3, 0);
    shape.quadraticCurveTo(result3 - 0.12, 0.1, result3 - 0.2, 0.13);
    shape.lineTo(-0.02, 0.13);
    shape.absarc(-0.02, 0, 0.13, Math.PI / 2, -Math.PI / 2, false);
    values.push(0, result2, 0, 0, value2, 0);
    values.add(`paint`, extrudePropShape(shape, 0.07, 0.02, 6), {
      x: 0.02,
      z: 0.11 * result4,
      tint: values2[value4 % 3],
      uv: {
        grain: 0,
      },
    });
    values.push(
      result3 * 0.45,
      0,
      0.11 * result4 + 0.047 * result4,
      0,
      result4 > 0 ? 0 : Math.PI,
      0,
    );
    values.push(0, 0, 0, 0, 0, 0, 1.6);
    appendSignpostIcon(values, value3, 0, 0, 0);
    values.pop();
    values.pop();
    values.add(`plain`, createBeveledPropBox(result3 * 0.62, 0.012, 0.008, 0.003), {
      x: result3 * 0.42,
      y: -0.095,
      z: 0.11 * result4 + 0.046 * result4,
      tint: values3[value4 % 3],
      noAO: true,
    });
    values.add(`metal`, new THREE.SphereGeometry(0.022, 6, 4), {
      x: -0.02,
      z: 0.11 * result4 + 0.045 * result4,
      tint: propsState.propPalette.iron,
    });
    values.pop();
  });
  return {
    radius: 0.3,
    colliders: [
      {
        x: 0,
        z: 0,
        radius: 0.3,
        h: 2.45,
        noTop: true,
      },
    ],
  };
}
