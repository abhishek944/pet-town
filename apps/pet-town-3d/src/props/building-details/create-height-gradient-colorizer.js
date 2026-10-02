/** Wall shading, ivy, trailing vines, flower rosettes, cottage windows and gabled roof details. */
import { mixPropScalar } from "../math/mix-prop-scalar.js";
export let createHeightGradientColorizer = (values) => (multiplyScalarValue, value, value2) => {
  let result = values[0][1];
  for (let result2 = 1; result2 < values.length; result2++) {
    let [result3, result4] = values[result2 - 1];
    let [result5, result6] = values[result2];
    if (value2 <= result5) {
      result =
        value2 <= result3
          ? result4
          : mixPropScalar(result4, result6, (value2 - result3) / (result5 - result3));
      break;
    }
    result = result6;
  }
  multiplyScalarValue.multiplyScalar(result);
};
