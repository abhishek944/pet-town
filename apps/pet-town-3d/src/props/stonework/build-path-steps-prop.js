/** Stairs, moss shading, faceted rocks, path stones and campfire base geometry. */
import { createBeveledPropBox } from "../geometry/create-beveled-prop-box.js";
import { clonePropColor } from "../geometry-builder/clone-prop-color.js";
import { propsState } from "../state.js";
import { createNoisyPropRock } from "../geometry/create-noisy-prop-rock.js";
export function buildPathStepsProp(addValue, rangeValue, riseValue = {}) {
  let result = riseValue.rise ?? 1;
  let result2 = Math.max(2, Math.round(result / 0.25));
  let result3 = 0.3;
  let result4 = 1.1;
  let values = [];
  for (let index = 0; index < result2; index++) {
    let result5 = (result * (index + 1)) / (result2 + 1);
    let result6 = 0.35 - (result2 - index - 0.5) * result3;
    addValue.add(
      `stone`,
      createBeveledPropBox(result4 + rangeValue.range(-0.06, 0.06), result5 + 0.3, 0.35, 0.06),
      {
        x: rangeValue.range(-0.03, 0.03),
        y: (result5 - 0.3) / 2,
        z: result6,
        tint: clonePropColor(propsState.propPalette.stone).multiplyScalar(
          rangeValue.range(0.9, 1.02),
        ),
        uv: {
          scale: 1 / 2,
        },
      },
    );
    values.push({
      cx: 0,
      cz: result6,
      hw: result4 / 2,
      hd: result3 / 2,
      y: result5,
    });
  }
  for (let result7 of [-1, 1]) {
    addValue.add(`rock`, createNoisyPropRock(0.18, 1, 0.3, 5, rangeValue.next() * 9, 0.7), {
      x: result7 * 0.67,
      y: 0.08,
      z: 0.35 - result2 * result3,
      tint: 13617080,
      down: 0.9,
    });
  }
  return {
    radius: 0.8,
    walk: values,
    colliders: [],
  };
}
