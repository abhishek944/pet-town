/** Logical canvas scale, palette conversions, wrapped painting primitives and seamless noise sampling. */
import { textureRgbToCss } from "./texture-rgb-to-css.js";
import { forEachWrappedTexturePosition } from "./for-each-wrapped-texture-position.js";
import { terrainState } from "../../state.js";
export function paintWrappedTextureCircle(painter, value, value2, value3, value4, value5) {
  painter.fillStyle = textureRgbToCss(value4, value5);
  forEachWrappedTexturePosition(value, value2, value3, (value6, value7) => {
    painter.beginPath();
    painter.arc(value6, value7, value3, 0, terrainState.textureFullTurn);
    painter.fill();
  });
}
