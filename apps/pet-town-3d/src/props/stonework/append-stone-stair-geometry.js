/** Stairs, moss shading, faceted rocks, path stones and campfire base geometry. */
import { createBeveledPropBox } from "../geometry/create-beveled-prop-box.js";
import { clonePropColor } from "../geometry-builder/clone-prop-color.js";
import { propsState } from "../state.js";
import { mixPropScalar } from "../math/mix-prop-scalar.js";
import { clampPropValue } from "../math/clamp-prop-value.js";
export function appendStoneStairGeometry(
  addValue,
  rangeValue,
  value,
  value2,
  FValue,
  value3,
  values,
  value4 = 1.4,
) {
  let result = Math.min(FValue.F, FValue.g) - Math.max(0.35, value3 * 0.5);
  for (let index = 0; index < FValue.n; index++) {
    let result2 = FValue.F - (index + 1) * FValue.rise;
    let result3 = value2 + FValue.depth / 2 + index * FValue.depth;
    let result4 = result2 - result;
    addValue.add(
      `stone`,
      createBeveledPropBox(
        value4 + rangeValue.range(-0.05, 0.05),
        result4,
        FValue.depth + 0.06,
        0.07,
      ),
      {
        x: value + rangeValue.range(-0.03, 0.03),
        y: result + result4 / 2,
        z: result3,
        tint: clonePropColor(propsState.propPalette.stone).multiplyScalar(
          rangeValue.range(0.9, 1.02),
        ),
        uv: {
          scale: 1 / 2,
        },
        colorFn: (multiplyScalarValue, value5, value6) =>
          multiplyScalarValue.multiplyScalar(
            mixPropScalar(0.78, 1, clampPropValue((value6 - result2 + 0.5) / 0.5)),
          ),
      },
    );
    values?.push({
      cx: value,
      cz: result3,
      hw: value4 / 2,
      hd: FValue.depth / 2,
      y: result2,
    });
  }
}
