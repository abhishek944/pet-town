/** Fence pickets, sloping fence segments, open gates and arched wooden bridge decks. */
import { propsState } from "../state.js";
import { mixPropScalar } from "../math/mix-prop-scalar.js";
import { createBeveledPropBox } from "../geometry/create-beveled-prop-box.js";
import { createPropPostCap } from "../street-furniture/create-prop-post-cap.js";
import { createFencePicketGeometry } from "./create-fence-picket-geometry.js";
import { clonePropColor } from "../geometry-builder/clone-prop-color.js";
export function buildFenceGeometry(values, rangeValue, values2, value, tintValue = {}) {
  let result = tintValue.tint ?? propsState.propPalette.fence;
  let result2 = tintValue.postTint ?? propsState.propPalette.fencePost;
  let values3 = [];
  for (let index = 0; index < values2.length - 1; index++) {
    let [result3, result4] = values2[index];
    let [result5, result6] = values2[index + 1];
    let hypotResult = Math.hypot(result5 - result3, result6 - result4);
    if (hypotResult < 0.2) {
      continue;
    }
    let result7 = Math.max(1, Math.ceil(hypotResult / 1.9));
    let atan2Result = Math.atan2(-(result6 - result4), result5 - result3);
    let values4 = [];
    for (let index2 = 0; index2 <= result7; index2++) {
      let result8 = index2 / result7;
      let mixPropScalarResult = mixPropScalar(result3, result5, result8);
      let mixPropScalarResult2 = mixPropScalar(result4, result6, result8);
      values4.push([
        mixPropScalarResult,
        value(mixPropScalarResult, mixPropScalarResult2),
        mixPropScalarResult2,
      ]);
    }
    for (let index3 = 0; index3 <= result7; index3++) {
      if (index3 === 0 && index > 0) {
        continue;
      }
      let [result9, result10, result11] = values4[index3];
      values.add(`paint`, createBeveledPropBox(0.17, 1.18, 0.17, 0.04), {
        x: result9,
        y: result10 + 0.51,
        z: result11,
        ry: atan2Result,
        tint: result2,
        gy: result10,
        uv: {
          grain: 1,
        },
      });
      values.add(`paint`, createPropPostCap(0.1, 0.12), {
        x: result9,
        y: result10 + 1.1,
        z: result11,
        tint: result2,
        gy: result10,
      });
    }
    for (let index4 = 0; index4 < result7; index4++) {
      let [result12, result13, result14] = values4[index4];
      let [result15, result16, result17] = values4[index4 + 1];
      let hypotResult2 = Math.hypot(result15 - result12, result17 - result14);
      let atan2Result2 = Math.atan2(result16 - result13, hypotResult2);
      for (let result19 of [0.3, 0.72]) {
        values.push(
          (result12 + result15) / 2,
          (result13 + result16) / 2 + result19,
          (result14 + result17) / 2,
          0,
          atan2Result,
          atan2Result2,
        );
        values.add(`paint`, createBeveledPropBox(hypotResult2, 0.09, 0.06, 0.025), {
          z: -0.06,
          tint: result2,
          gy: (result13 + result16) / 2,
          uv: {
            grain: 0,
          },
        });
        values.pop();
      }
      let result18 = Math.max(2, Math.round(hypotResult2 / 0.27));
      for (let result20 = 1; result20 < result18; result20++) {
        let result21 = result20 / result18;
        let mixPropScalarResult3 = mixPropScalar(result12, result15, result21);
        let mixPropScalarResult4 = mixPropScalar(result14, result17, result21);
        let mixPropScalarResult5 = mixPropScalar(result13, result16, result21);
        let valueResult = value(mixPropScalarResult3, mixPropScalarResult4);
        let result22 = Math.min(valueResult, mixPropScalarResult5) - 0.1;
        let result23 =
          mixPropScalarResult5 +
          0.9 +
          Math.sin((result20 / result18) * Math.PI) * 0.05 +
          rangeValue.range(-0.04, 0.04) -
          result22;
        let rangeResult = rangeValue.range(-0.035, 0.035);
        values.push(mixPropScalarResult3, result22, mixPropScalarResult4, 0, atan2Result, 0);
        values.add(`paint`, createFencePicketGeometry(0.11, result23 + 0.06, 0.05), {
          rz: rangeResult,
          rx: rangeValue.range(-0.02, 0.02),
          tint: clonePropColor(result).multiplyScalar(rangeValue.range(0.95, 1.02)),
          gy: valueResult,
          uv: {
            grain: 1,
          },
        });
        values.pop();
      }
      values3.push({
        kind: `segment`,
        x1: result12,
        z1: result14,
        x2: result15,
        z2: result17,
        r: 0.12,
        y0: Math.min(result13, result16) - 0.1,
        h: Math.abs(result16 - result13) + 1.3,
        noTop: true,
      });
    }
  }
  return values3;
}
