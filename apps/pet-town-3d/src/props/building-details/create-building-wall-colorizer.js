/** Wall shading, ivy, trailing vines, flower rosettes, cottage windows and gabled roof details. */
import { mixPropScalar } from "../math/mix-prop-scalar.js";
import { propSmoothstep } from "../math/prop-smoothstep.js";
import { propFractalNoise3d } from "../math/prop-fractal-noise3d.js";
export function createBuildingWallColorizer(
  value,
  value2,
  value3,
  value4,
  value5 = 0,
  value6 = value4,
) {
  return (color, value7, value8, value9) => {
    let result =
      mixPropScalar(0.8, 1, propSmoothstep(value3, value3 + 0.9, value8)) *
      mixPropScalar(1, 0.9, propSmoothstep(value6 - 0.8, value6, value8));
    let result2 =
      Math.abs(Math.abs(value9) - value2 / 2) < 0.05
        ? value / 2 - Math.abs(value7)
        : value2 / 2 - Math.abs(value9);
    result *= mixPropScalar(0.86, 1, propSmoothstep(0, 0.8, result2));
    let result3 =
      propFractalNoise3d(value7 * 0.8 + value5, value8 * 0.8, value9 * 0.8 - value5, 2) - 0.5;
    let result4 = propFractalNoise3d(value7 * 2.6, value8 * 2.6 + value5, value9 * 2.6, 2) - 0.5;
    color.r *= 1 + result3 * 0.12;
    color.g *= 1 + result3 * 0.03;
    color.b *= 1 - result3 * 0.14;
    color.multiplyScalar(result * (1 + result4 * 0.1));
  };
}
