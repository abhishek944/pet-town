/** Wall shading, ivy, trailing vines, flower rosettes, cottage windows and gabled roof details. */
import { createBeveledPropBox } from "../geometry/create-beveled-prop-box.js";
import { shadeBuildingColor } from "./shade-building-color.js";
export function appendGabledRoofGeometry(addValue, value) {
  let {
    cx: valueValue,
    yB: valueValue2,
    cw: valueValue3,
    z0: valueValue4,
    z1: valueValue5,
    tint: valueValue6,
    trim: valueValue7,
    pitch: valueValue8 = 0.72,
    th: valueValue9 = 0.24,
    over: valueValue10 = 0.28,
  } = value;
  let result = Math.tan(valueValue8);
  let result2 = valueValue3 / 2 + valueValue10;
  let result3 = valueValue5 - valueValue4;
  let result4 = (valueValue4 + valueValue5) / 2;
  for (let result5 of [-1, 1]) {
    let result6 = valueValue + (result5 * result2) / 2;
    let result7 = valueValue2 + (valueValue3 / 2 - result2 / 2) * result;
    let result8 = result2 / Math.cos(valueValue8) + valueValue9 * result * 0.5 + 0.04;
    let result9 = (result8 - result2 / Math.cos(valueValue8)) / 2;
    let result10 = Math.sin(valueValue8) * result5;
    let result11 = Math.cos(valueValue8);
    addValue.add(`shingle`, createBeveledPropBox(result8, valueValue9, result3, 0.07), {
      x: result6 + (result10 * valueValue9) / 2 - result5 * Math.cos(valueValue8) * result9,
      y: result7 + (result11 * valueValue9) / 2 + Math.sin(valueValue8) * result9,
      z: result4,
      rz: -result5 * valueValue8,
      tint: valueValue6,
      noAO: true,
      uv: {
        grain: 2,
        flipV: result5 > 0,
      },
    });
    addValue.add(`paint`, createBeveledPropBox(result8, 0.3, 0.1, 0.04), {
      x: result6 - result5 * Math.cos(valueValue8) * result9,
      y: result7 + Math.sin(valueValue8) * result9 - 0.02,
      z: valueValue5 + 0.05,
      rz: -result5 * valueValue8,
      tint: valueValue7,
      noAO: true,
    });
  }
  addValue.add(`shingle`, createBeveledPropBox(0.4, 0.22, result3 + 0.1, 0.09), {
    x: valueValue,
    y: valueValue2 + (valueValue3 / 2) * result + valueValue9 / Math.cos(valueValue8) - 0.02,
    z: result4 + 0.05,
    tint: shadeBuildingColor(valueValue6, 0.72),
    noAO: true,
    uv: {
      grain: 2,
    },
  });
  return {
    apex: valueValue2 + (valueValue3 / 2) * result,
  };
}
