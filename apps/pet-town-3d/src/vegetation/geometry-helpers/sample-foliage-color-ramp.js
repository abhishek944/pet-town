/** Foliage color ramps and vertex attributes, geometry buffers, normals and geometry merging. */
import { clampFoliageUnit } from "./clamp-foliage-unit.js";
import { mixFoliageRgb } from "./mix-foliage-rgb.js";
export function sampleFoliageColorRamp(values, value) {
  value = clampFoliageUnit(value);
  for (let result = 1; result < values.length; result++) {
    if (value <= values[result][0]) {
      let [result2, result3] = values[result - 1];
      let [result4, result5] = values[result];
      return mixFoliageRgb(result3, result5, (value - result2) / Math.max(1e-6, result4 - result2));
    }
  }
  return values[values.length - 1][1];
}
