/** Logical canvas scale, palette conversions, wrapped painting primitives and seamless noise sampling. */
import { textureRgbToCss } from "./texture-rgb-to-css.js";
import { forEachWrappedTexturePosition } from "./for-each-wrapped-texture-position.js";
export function paintWrappedTextureStroke(
  painter,
  value,
  value2,
  value3,
  value4,
  value5,
  value6,
  value7,
  value8 = 0,
) {
  painter.strokeStyle = textureRgbToCss(value6, value7);
  painter.lineWidth = value5;
  let result = Math.cos(value3) * value4;
  let result2 = Math.sin(value3) * value4;
  let result3 = -Math.sin(value3) * value8;
  let result4 = Math.cos(value3) * value8;
  forEachWrappedTexturePosition(
    value,
    value2,
    value4 + value5 + Math.abs(value8),
    (value9, value10) => {
      painter.beginPath();
      painter.moveTo(value9, value10);
      painter.quadraticCurveTo(
        value9 + result / 2 + result3,
        value10 + result2 / 2 + result4,
        value9 + result,
        value10 + result2,
      );
      painter.stroke();
    },
  );
}
