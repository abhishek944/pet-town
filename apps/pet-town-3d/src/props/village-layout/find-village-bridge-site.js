/** Deterministic settlement layout, buildings, connecting footpaths, lamps, props and bridge site selection. */
import { mixPropScalar } from "../math/mix-prop-scalar.js";
export function findVillageBridgeSite(hValue, position, value, someValue, value2 = 30) {
  let result = null;
  let result2 = 1 / 0;
  let values = [
    [1, 0],
    [0, 1],
    [Math.SQRT1_2, Math.SQRT1_2],
    [Math.SQRT1_2, -Math.SQRT1_2],
  ];
  let callback = (value3, value4) => hValue.h(value3, value4) >= value + 0.3;
  for (let result3 = position.x - value2; result3 <= position.x + value2; result3 += 2) {
    for (let result4 = position.z - value2; result4 <= position.z + value2; result4 += 2) {
      if (!(
        Math.hypot(result3 - position.x, result4 - position.z) > value2 ||
        !hValue.inBounds(result3, result4, 6) ||
        hValue.h(result3, result4) > value - 0.05
      )) {
        for (let [result5, result6] of values) {
          let callback2 = (value5) => {
            for (let result18 = 0.5; result18 <= 8; result18 += 0.5) {
              if (
                callback(
                  result3 + result5 * result18 * value5,
                  result4 + result6 * result18 * value5,
                )
              ) {
                return result18;
              }
            }
            return null;
          };
          let callback2Result = callback2(-1);
          let callback2Result2 = callback2(1);
          if (callback2Result == null || callback2Result2 == null) {
            continue;
          }
          let result7 = callback2Result + callback2Result2 + 1.2;
          if (result7 < 3.5 || result7 > 13) {
            continue;
          }
          let result8 = result3 - result5 * (callback2Result + 0.6);
          let result9 = result4 - result6 * (callback2Result + 0.6);
          let result10 = result3 + result5 * (callback2Result2 + 0.6);
          let result11 = result4 + result6 * (callback2Result2 + 0.6);
          let result12 = hValue.h(result8, result9);
          let result13 = hValue.h(result10, result11);
          if (
            Math.abs(result12 - result13) > 2.2 ||
            result12 > value + 3.5 ||
            result13 > value + 3.5
          ) {
            continue;
          }
          let result14 = -result6;
          let result5Value = result5;
          let enabled = true;
          for (let result19 of [-1.1, 1.1]) {
            if (
              !callback(result8 + result14 * result19, result9 + result5Value * result19) ||
              !callback(result10 + result14 * result19, result11 + result5Value * result19)
            ) {
              enabled = false;
            }
          }
          for (let [result20, result21, result22, result23] of [
            [result8, result9, result12, -1],
            [result10, result11, result13, 1],
          ]) {
            for (let [result24, result25] of [
              [result14 * 1.1, result5Value * 1.1],
              [-result14 * 1.1, -result5Value * 1.1],
              [
                result14 * 0.6 + result5 * 0.5 * result23,
                result5Value * 0.6 + result6 * 0.5 * result23,
              ],
              [
                -result14 * 0.6 + result5 * 0.5 * result23,
                -result5Value * 0.6 + result6 * 0.5 * result23,
              ],
            ]) {
              if (hValue.h(result20 + result24, result21 + result25) > result22 + 0.4) {
                enabled = false;
              }
            }
          }
          if (!enabled) {
            continue;
          }
          for (let result26 = 0.25; result26 < 0.8; result26 += 0.25) {
            let mixPropScalarResult = mixPropScalar(result8, result10, result26);
            let mixPropScalarResult2 = mixPropScalar(result9, result11, result26);
            if (
              someValue.some(
                (position2) =>
                  Math.hypot(
                    position2.x - mixPropScalarResult,
                    position2.z - mixPropScalarResult2,
                  ) < position2.r,
              )
            ) {
              enabled = false;
            }
          }
          if (!enabled) {
            continue;
          }
          let result15 = (result8 + result10) / 2;
          let result16 = (result9 + result11) / 2;
          let result17 =
            result7 * 0.4 +
            Math.hypot(result15 - position.x, result16 - position.z) * 0.3 +
            Math.abs(result12 - result13) * 1.5;
          if (result17 < result2) {
            result2 = result17;
            let hypotResult = Math.hypot(result10 - result8, result11 - result9);
            result = {
              ax: result8,
              az: result9,
              bx: result10,
              bz: result11,
              yA: result12,
              yB: result13,
              L: hypotResult,
              dx: (result10 - result8) / hypotResult,
              dz: (result11 - result9) / hypotResult,
              mx: result15,
              mz: result16,
              water: value,
            };
          }
        }
      }
    }
  }
  return result;
}
