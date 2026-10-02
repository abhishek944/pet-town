/** Logical canvas scale, palette conversions, wrapped painting primitives and seamless noise sampling. */
import { textureRgbToCss } from "./texture-rgb-to-css.js";
import { forEachWrappedTexturePosition } from "./for-each-wrapped-texture-position.js";
import { terrainState } from "../../state.js";
export function paintWrappedTextureEllipse(
  painter,
  value,
  value2,
  value3,
  value4,
  value5,
  value6,
  value7,
) {
  painter.fillStyle = textureRgbToCss(value6, value7);
  forEachWrappedTexturePosition(value, value2, Math.max(value3, value4) + 2, (value8, value9) => {
    painter.beginPath();
    painter.ellipse(value8, value9, value3, value4, value5, 0, terrainState.textureFullTurn);
    painter.fill();
  });
}
