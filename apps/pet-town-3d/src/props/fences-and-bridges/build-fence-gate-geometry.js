/** Fence pickets, sloping fence segments, open gates and arched wooden bridge decks. */
import * as THREE from "three";
import { propsState } from "../state.js";
import { createFencePicketGeometry } from "./create-fence-picket-geometry.js";
import { createBeveledPropBox } from "../geometry/create-beveled-prop-box.js";
import { createPropPostCap } from "../street-furniture/create-prop-post-cap.js";
export function buildFenceGateGeometry(values, value, value2, value3, value4, openValue = {}) {
  let [value2Value, value2Value2] = value2;
  let [value3Value, value3Value2] = value3;
  let hypotResult = Math.hypot(value3Value - value2Value, value3Value2 - value2Value2);
  let atan2Result = Math.atan2(-(value3Value2 - value2Value2), value3Value - value2Value);
  let value4Result = value4(value2Value, value2Value2);
  let result = openValue.open ?? 0.55;
  let result2 = hypotResult - 0.2;
  values.push(value2Value, value4Result, value2Value2, 0, atan2Result + result, 0);
  let fence2 = propsState.propPalette.fence;
  for (let index = 0; index < 5; index++) {
    let result6 = 0.12 + ((index + 0.5) * (result2 - 0.1)) / 5;
    values.add(
      `paint`,
      createFencePicketGeometry(0.1, 0.92 + Math.sin(((index + 0.5) / 5) * Math.PI) * 0.1, 0.045),
      {
        x: result6,
        y: 0.08,
        tint: fence2,
        gy: value4Result,
        uv: {
          grain: 1,
        },
      },
    );
  }
  for (let result7 of [0.3, 0.72]) {
    values.add(`paint`, createBeveledPropBox(result2, 0.09, 0.05, 0.02), {
      x: result2 / 2 + 0.08,
      y: result7,
      z: -0.05,
      tint: propsState.propPalette.fencePost,
      gy: value4Result,
      uv: {
        grain: 0,
      },
    });
  }
  let hypotResult2 = Math.hypot(result2 - 0.1, 0.42);
  values.add(`paint`, createBeveledPropBox(hypotResult2, 0.07, 0.04, 0.015), {
    x: result2 / 2 + 0.08,
    y: 0.51,
    z: -0.05,
    rz: Math.atan2(0.42, result2 - 0.1),
    tint: propsState.propPalette.fencePost,
  });
  for (let result8 of [0.3, 0.72]) {
    values.add(`metal`, createBeveledPropBox(0.14, 0.05, 0.02, 0.006), {
      x: 0.06,
      y: result8,
      z: 0.03,
      tint: propsState.propPalette.iron,
    });
  }
  values.add(`metal`, new THREE.TorusGeometry(0.035, 0.01, 4, 10), {
    x: result2 - 0.02,
    y: 0.62,
    z: 0.04,
    tint: propsState.propPalette.iron,
  });
  values.pop();
  let result3 = atan2Result + result;
  let result4 = value2Value + Math.cos(result3) * (result2 + 0.1);
  let result5 = value2Value2 - Math.sin(result3) * (result2 + 0.1);
  for (let [result9, result10] of [value2, value3]) {
    let value4Result2 = value4(result9, result10);
    values.add(`paint`, createPropPostCap(0.13, 0.18), {
      x: result9,
      y: value4Result2 + 1.2,
      z: result10,
      tint: propsState.propPalette.fencePost,
      gy: value4Result2,
    });
  }
  return [
    {
      kind: `segment`,
      x1: value2Value,
      z1: value2Value2,
      x2: result4,
      z2: result5,
      r: 0.08,
      y0: value4Result - 0.1,
      h: 1.3,
      noTop: true,
    },
  ];
}
