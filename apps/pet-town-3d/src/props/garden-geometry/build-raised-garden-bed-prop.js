/** Flower pots, produce piles, individual crops, raised garden beds, scarecrows and washing lines. */
import { createBeveledPropBox } from "../geometry/create-beveled-prop-box.js";
import { propsState } from "../state.js";
import { appendCabbageGeometry } from "./append-cabbage-geometry.js";
import { appendCarrotGeometry } from "./append-carrot-geometry.js";
import { appendTomatoPlantGeometry } from "./append-tomato-plant-geometry.js";
import { appendGardenFlowerGeometry } from "./append-garden-flower-geometry.js";
import { appendPumpkinGeometry } from "./append-pumpkin-geometry.js";
export function buildRaisedGardenBedProp(values, rangeValue, wValue = {}) {
  let result = wValue.w ?? 2.6;
  let result2 = wValue.d ?? 1.3;
  let result3 = 0.36;
  let result4 = wValue.crop ?? `cabbage`;
  let result5 = 0.13;
  for (let result8 of [-1, 1]) {
    values.add(`wood`, createBeveledPropBox(result, result3, result5, 0.03), {
      y: result3 / 2,
      z: result8 * (result2 / 2 - result5 / 2),
      tint: propsState.propPalette.woodWarm,
      jitter: 0.05,
      uv: {
        grain: 0,
      },
    });
    values.add(`wood`, createBeveledPropBox(result5, result3, result2 - 2 * result5, 0.03), {
      x: result8 * (result / 2 - result5 / 2),
      y: result3 / 2,
      tint: propsState.propPalette.woodWarm,
      jitter: 0.05,
      uv: {
        grain: 2,
      },
    });
    for (let result9 of [-1, 1]) {
      values.add(`wood`, createBeveledPropBox(0.16, 0.44, 0.16, 0.03), {
        x: result8 * (result / 2 - 0.02),
        y: 0.44 / 2,
        z: result9 * (result2 / 2 - 0.02),
        tint: propsState.propPalette.timber,
      });
    }
  }
  values.add(
    `soil`,
    createBeveledPropBox(
      result - 2 * result5 + 0.02,
      0.33999999999999997,
      result2 - 2 * result5 + 0.02,
      0.05,
    ),
    {
      y: 0.33999999999999997 / 2,
      uv: {
        grain: 0,
        scale: 1 / 1.6,
      },
    },
  );
  let result6 = Math.max(1, Math.round((result2 - 0.3) / 0.45));
  let result7 = Math.max(1, Math.round((result - 0.3) / 0.42));
  values.push(0, 0.33999999999999997, 0);
  for (let index = 0; index < result6; index++) {
    for (let index2 = 0; index2 < result7; index2++) {
      let result10 =
        -result / 2 +
        0.2 +
        ((index2 + 0.5) * (result - 0.4)) / result7 +
        rangeValue.range(-0.04, 0.04);
      let result11 = -result2 / 2 + 0.15 + ((index + 0.5) * (result2 - 0.3)) / result6;
      if (result4 === `cabbage`) {
        appendCabbageGeometry(values, rangeValue, result10, result11);
      } else {
        if (result4 === `carrot`) {
          appendCarrotGeometry(values, rangeValue, result10, result11);
        } else {
          if (result4 === `tomato`) {
            if (index2 % 2 == 0) {
              appendTomatoPlantGeometry(values, rangeValue, result10, result11);
            } else {
              appendCarrotGeometry(values, rangeValue, result10, result11);
            }
          } else {
            if (result4 === `flowers`) {
              appendGardenFlowerGeometry(values, rangeValue, result10, result11);
            } else {
              if (result4 === `pumpkin`) {
                if ((index + index2) % 2 == 0) {
                  appendPumpkinGeometry(values, rangeValue, result10, result11, 0.2);
                } else {
                  appendCabbageGeometry(values, rangeValue, result10, result11);
                }
              }
            }
          }
        }
      }
    }
  }
  values.pop();
  return {
    radius: Math.hypot(result, result2) / 2,
    colliders: [
      {
        x: 0,
        z: 0,
        w: result,
        d: result2,
        radius: Math.hypot(result, result2) / 2,
        h: 0.38,
      },
    ],
  };
}
