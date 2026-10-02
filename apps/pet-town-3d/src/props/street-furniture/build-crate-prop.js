/** Lampposts, lanterns, benches, log seats, signposts, mailboxes, barrels, crates and sacks. */
import { propsState } from "../state.js";
import { createBeveledPropBox } from "../geometry/create-beveled-prop-box.js";
export function buildCrateProp(values, value, sValue = {}) {
  let result = sValue.s ?? 0.72;
  let result2 = sValue.tint ?? propsState.propPalette.woodLight;
  let result3 = sValue.frame ?? propsState.propPalette.woodWarm;
  values.push(0, result / 2, 0, 0, sValue.ry ?? 0, 0);
  values.add(`wood`, createBeveledPropBox(result * 0.92, result * 0.92, result * 0.92, 0.02), {
    tint: result2,
    jitter: 0.05,
  });
  let result4 = result / 2 - 0.045;
  let result5 = 0.1;
  for (let result6 of [-1, 1]) {
    for (let result7 of [-1, 1]) {
      values.add(`wood`, createBeveledPropBox(result, result5, result5, 0.025), {
        y: result6 * result4,
        z: result7 * result4,
        tint: result3,
      });
      values.add(`wood`, createBeveledPropBox(result5, result - 0.02, result5, 0.025), {
        x: result6 * result4,
        z: result7 * result4,
        tint: result3,
        uv: {
          grain: 1,
        },
      });
      values.add(`wood`, createBeveledPropBox(result5, result5, result - 0.02, 0.025), {
        x: result6 * result4,
        y: result7 * result4,
        tint: result3,
      });
    }
  }
  for (let result8 of [-1, 1]) {
    values.add(`wood`, createBeveledPropBox(result * 1.15, 0.09, 0.04, 0.015), {
      z: result8 * (result / 2 - 0.01),
      rz: (Math.PI / 4) * result8,
      tint: result3,
    });
  }
  values.pop();
  return {
    radius: result * 0.7,
    colliders: [
      (sValue.ry ?? 0)
        ? {
            x: 0,
            z: 0,
            radius: result * 0.58,
            h: result,
          }
        : {
            x: 0,
            z: 0,
            w: result,
            d: result,
            radius: result * 0.7,
            h: result,
          },
    ],
  };
}
