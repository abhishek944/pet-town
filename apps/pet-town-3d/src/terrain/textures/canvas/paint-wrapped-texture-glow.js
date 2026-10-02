/** Logical canvas scale, palette conversions, wrapped painting primitives and seamless noise sampling. */
import { forEachWrappedTexturePosition } from "./for-each-wrapped-texture-position.js";
import { textureRgbToCss } from "./texture-rgb-to-css.js";
export function paintWrappedTextureGlow(painter, value, value2, value3, value4, value5) {
  forEachWrappedTexturePosition(value, value2, value3, (value6, value7) => {
    let radialGradientResult = painter.createRadialGradient(
      value6,
      value7,
      0,
      value6,
      value7,
      value3,
    );
    radialGradientResult.addColorStop(0, textureRgbToCss(value4, value5));
    radialGradientResult.addColorStop(0.6, textureRgbToCss(value4, value5 * 0.55));
    radialGradientResult.addColorStop(1, textureRgbToCss(value4, 0));
    painter.fillStyle = radialGradientResult;
    painter.fillRect(value6 - value3, value7 - value3, value3 * 2, value3 * 2);
  });
}
