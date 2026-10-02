/** Fence pickets, sloping fence segments, open gates and arched wooden bridge decks. */
import * as THREE from "three";
import { mixPropScalar } from "../math/mix-prop-scalar.js";
import { clampPropValue } from "../math/clamp-prop-value.js";
import { createBeveledPropBox } from "../geometry/create-beveled-prop-box.js";
import { propsState } from "../state.js";
import { createPropPostCap } from "../street-furniture/create-prop-post-cap.js";
import { createBeveledPropCylinder } from "../geometry/create-beveled-prop-cylinder.js";
export function buildArchedBridgeGeometry(
  addValue,
  rangeValue,
  value,
  value2,
  value3,
  value4,
  value5,
) {
  let result = 1.9;
  let callback = (value6) => mixPropScalar(value2, value3, value6) - value5 + 0.28;
  let result2 = value4 - value5 + 0.6;
  let result3 = Math.max(Math.min(1.1, 0.25 + value * 0.08), result2 - callback(0.5), 0.2);
  let callback2 = (value7) => {
    let clampPropValueResult = clampPropValue(value7 / value);
    return callback(clampPropValueResult) + result3 * Math.sin(Math.PI * clampPropValueResult);
  };
  let callback3 = (value8) => Math.atan2(callback2(value8 + 0.05) - callback2(value8 - 0.05), 0.1);
  let result4 = Math.min(value2, value3, value4) - value5 - 1.2;
  for (let result6 = -0.5; result6 <= value + 0.5; result6 += 0.31) {
    addValue.add(
      `wood`,
      createBeveledPropBox(0.28, 0.1, result + rangeValue.range(-0.06, 0.06), 0.025),
      {
        x: result6,
        y: callback2(result6) - 0.05,
        z: rangeValue.range(-0.03, 0.03),
        rz: callback3(result6),
        ry: rangeValue.range(-0.02, 0.02),
        tint: propsState.propPalette.woodWarm,
        jitter: 0.1,
        noAO: true,
        uv: {
          grain: 2,
        },
      },
    );
  }
  let ceilResult = Math.ceil((value + 1) / 0.5);
  for (let index = 0; index < ceilResult; index++) {
    let result7 = -0.5 + (index * (value + 1)) / ceilResult;
    let result8 = result7 + (value + 1) / ceilResult;
    let result9 = (result7 + result8) / 2;
    for (let result10 of [-0.7, 0.7]) {
      addValue.add(
        `wood`,
        createBeveledPropBox(
          Math.hypot(result8 - result7, callback2(result8) - callback2(result7)) + 0.05,
          0.2,
          0.16,
          0.03,
        ),
        {
          x: result9,
          y: (callback2(result7) + callback2(result8)) / 2 - 0.2,
          z: result10,
          rz: Math.atan2(callback2(result8) - callback2(result7), result8 - result7),
          tint: propsState.propPalette.woodDark,
          noAO: true,
        },
      );
    }
  }
  let result5 = Math.max(2, Math.round(value / 1.15));
  for (let result11 of [-1.9 / 2 + 0.02, result / 2 - 0.02]) {
    let values = [];
    let values2 = [];
    for (let index2 = 0; index2 <= result5; index2++) {
      let result12 = -0.2 + (index2 * (value + 0.4)) / result5;
      let callback2Result = callback2(result12);
      let result13 = index2 === 0 || index2 === result5;
      addValue.add(`wood`, createBeveledPropBox(0.14, 1 + (result13 ? 0.14 : 0), 0.14, 0.03), {
        x: result12,
        y: callback2Result + 0.42 + (result13 ? 0.07 : 0),
        z: result11,
        tint: propsState.propPalette.timber,
        noAO: true,
        uv: {
          grain: 1,
        },
      });
      if (result13) {
        addValue.add(`wood`, createPropPostCap(0.11, 0.14), {
          x: result12,
          y: callback2Result + 0.98,
          z: result11,
          tint: propsState.propPalette.woodDark,
          noAO: true,
        });
      }
    }
    for (let index3 = 0; index3 <= 16; index3++) {
      let result14 = -0.2 + (index3 / 16) * (value + 0.4);
      values.push(new THREE.Vector3(result14, callback2(result14) + 0.87, result11));
      values2.push(new THREE.Vector3(result14, callback2(result14) + 0.5, result11));
    }
    addValue.add(`wood`, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(values), 40, 0.06, 6), {
      tint: propsState.propPalette.woodLight,
      noAO: true,
      uv: {
        mode: `native`,
        su: (value + 0.4) / 2,
        sv: 0.2,
      },
    });
    addValue.add(`wood`, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(values2), 40, 0.04, 5), {
      tint: propsState.propPalette.woodLight,
      noAO: true,
      uv: {
        mode: `native`,
        su: (value + 0.4) / 2,
        sv: 0.15,
      },
    });
  }
  for (let result15 of [0, value]) {
    let result16 = callback2(result15) - 0.12 - result4;
    addValue.add(`stone`, createBeveledPropBox(1.3, result16, 2.5, 0.1), {
      x: result15,
      y: result4 + result16 / 2,
      tint: propsState.propPalette.stone,
      noAO: true,
      uv: {
        scale: 1 / 2,
      },
    });
  }
  if (value > 5) {
    for (let result17 of [1 / 3, 2 / 3]) {
      let result18 = result17 * value;
      let result19 = callback2(result18) - 0.3;
      let result20 = value4 - value5 - 1.6;
      for (let result21 of [-0.72, 0.72]) {
        addValue.add(`wood`, createBeveledPropCylinder(0.13, result19 - result20, 8, 0.03), {
          x: result18,
          y: result20,
          z: result21,
          tint: propsState.propPalette.woodDark,
          noAO: true,
          uv: {
            mode: `native`,
            su: 0.4,
            sv: 1,
            swap: true,
          },
        });
      }
      addValue.add(`wood`, createBeveledPropBox(0.14, 0.14, 1.7, 0.03), {
        x: result18,
        y: result19 - 0.2,
        tint: propsState.propPalette.woodDark,
        noAO: true,
      });
    }
  }
  return {
    deckY: callback2,
  };
}
