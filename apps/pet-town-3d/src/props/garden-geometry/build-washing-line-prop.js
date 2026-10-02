/** Flower pots, produce piles, individual crops, raised garden beds, scarecrows and washing lines. */
import * as THREE from "three";
import { createBeveledPropBox } from "../geometry/create-beveled-prop-box.js";
import { propsState } from "../state.js";
import { createPropPostCap } from "../street-furniture/create-prop-post-cap.js";
import { buildCrateProp } from "../street-furniture/build-crate-prop.js";
export function buildWashingLineProp(values, rangeValue, lenValue = {}) {
  let result = lenValue.len ?? 3.6;
  for (let result2 of [-1, 1]) {
    values.add(`wood`, createBeveledPropBox(0.12, 1.9500000000000002, 0.12, 0.03), {
      x: (result2 * result) / 2,
      y: 1.9500000000000002 / 2,
      tint: propsState.propPalette.woodDark,
      uv: {
        grain: 1,
      },
    });
    values.add(`wood`, createBeveledPropBox(0.1, 0.1, 0.6, 0.02), {
      x: (result2 * result) / 2,
      y: 1.85,
      tint: propsState.propPalette.woodDark,
    });
    values.add(`wood`, createPropPostCap(0.07, 0.07), {
      x: (result2 * result) / 2,
      y: 1.9500000000000002,
      tint: propsState.propPalette.woodDark,
    });
  }
  let values2 = [15902647, 16644074, 9226216, 16175963, 16644074, 10933914];
  for (let result3 of [-0.22, 0.22]) {
    let values3 = [];
    for (let index = 0; index <= 8; index++) {
      let result4 = index / 8;
      let result5 = -result / 2 + result4 * result;
      values3.push(new THREE.Vector3(result5, 1.87 - Math.sin(result4 * Math.PI) * 0.3, result3));
    }
    let catmullRomCurve3 = new THREE.CatmullRomCurve3(values3);
    if (
      (values.add(`plain`, new THREE.TubeGeometry(catmullRomCurve3, 16, 0.008, 3), {
        tint: 15261900,
        noAO: true,
      }),
      result3 > 0)
    ) {
      let result6 = -result / 2 + 0.35;
      for (let index2 = 0; index2 < 5 && result6 < result / 2 - 0.3; index2++) {
        let rangeResult = rangeValue.range(0.32, 0.62);
        let rangeResult2 = rangeValue.range(0.38, 0.62);
        let result7 = (result6 + rangeResult / 2 + result / 2) / result;
        let result8 = 1.87 - Math.sin(result7 * Math.PI) * 0.3;
        let planeGeometry = new THREE.PlaneGeometry(rangeResult, rangeResult2, 6, 6);
        let position2 = planeGeometry.attributes.position;
        let result9 = rangeValue.next() * 6;
        for (let index3 = 0; index3 < position2.count; index3++) {
          let result10 = position2.getX(index3) / rangeResult + 0.5;
          let result11 = 0.5 - position2.getY(index3) / rangeResult2;
          position2.setZ(
            index3,
            Math.sin(result10 * Math.PI) * 0.05 * result11 +
              Math.sin(result10 * 7 + result9) * 0.03 * result11 * result11,
          );
          position2.setY(
            index3,
            position2.getY(index3) - Math.sin(result10 * Math.PI) * 0.04 * (1 - result11),
          );
        }
        planeGeometry.computeVertexNormals();
        values.add(`sail`, planeGeometry, {
          x: result6 + rangeResult / 2,
          y: result8 - rangeResult2 / 2 - 0.01,
          z: result3 + 0.02,
          rx: rangeValue.range(-0.2, -0.06),
          tint: values2[index2 % values2.length],
          noAO: true,
          uv: {
            mode: `native`,
            su: rangeResult / 1.2,
            sv: rangeResult2 / 1.2,
          },
        });
        for (let result12 of [result6 + 0.05, result6 + rangeResult - 0.05]) {
          values.add(`wood`, createBeveledPropBox(0.02, 0.07, 0.025, 0.005), {
            x: result12,
            y: result8,
            z: result3 + 0.02,
            tint: propsState.propPalette.woodLight,
          });
        }
        result6 += rangeResult + rangeValue.range(0.08, 0.22);
      }
    }
  }
  values.push(-result / 2 + 0.55, 0, 0.55);
  buildCrateProp(values, rangeValue, {
    s: 0.45,
    ry: 0.4,
    tint: 15321240,
  });
  values.pop();
  values.add(`sail`, createBeveledPropBox(0.36, 0.14, 0.3, 0.05), {
    x: -result / 2 + 0.55,
    y: 0.5,
    z: 0.55,
    ry: 0.4,
    tint: 16644074,
  });
  return {
    radius: result / 2,
    colliders: [
      {
        x: -result / 2,
        z: 0,
        radius: 0.1,
        h: 1.9500000000000002,
        noTop: true,
      },
      {
        x: result / 2,
        z: 0,
        radius: 0.1,
        h: 1.9500000000000002,
        noTop: true,
      },
      {
        x: -result / 2 + 0.55,
        z: 0.55,
        radius: 0.3,
        h: 0.58,
        noTop: true,
      },
    ],
  };
}
