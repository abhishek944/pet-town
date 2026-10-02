/** Logical canvas scale, palette conversions, wrapped painting primitives and seamless noise sampling. */
import { interpolateTextureRgb } from "./interpolate-texture-rgb.js";
import { paintWrappedTextureEllipse } from "./paint-wrapped-texture-ellipse.js";
export function paintTexturePebble(value, value2, value3, value4, value5, value6, value7) {
  let result = value2() * Math.PI;
  let interpolateTextureRgbResult = interpolateTextureRgb(value7, [40, 28, 20], 0.55);
  let interpolateTextureRgbResult2 = interpolateTextureRgb(value7, [255, 250, 235], 0.45);
  paintWrappedTextureEllipse(
    value,
    value3 + 0.5,
    value4 + 1.2,
    value5 * 1.1,
    value6 * 1.12,
    result,
    interpolateTextureRgbResult,
    0.26,
  );
  paintWrappedTextureEllipse(value, value3, value4, value5, value6, result, value7, 0.9);
  paintWrappedTextureEllipse(
    value,
    value3 - value5 * 0.2,
    value4 - value6 * 0.25,
    value5 * 0.65,
    value6 * 0.55,
    result,
    interpolateTextureRgbResult2,
    0.3,
  );
}
