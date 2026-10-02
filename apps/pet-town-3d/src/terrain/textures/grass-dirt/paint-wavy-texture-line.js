/** Grass and earth surface textures and wavy line painting. */
import { textureRgbToCss } from "../canvas/texture-rgb-to-css.js";
import { terrainState } from "../../state.js";
export function paintWavyTextureLine(
  painter,
  value,
  value2,
  value3,
  value4,
  value5,
  value6,
  value7,
) {
  painter.strokeStyle = textureRgbToCss(value5, value6);
  painter.lineWidth = value7;
  for (let result of [-256, 0, terrainState.terrainTextureLogicalSize]) {
    painter.beginPath();
    for (let result2 = -4; result2 <= 260; result2 += 4) {
      let result3 =
        value +
        result +
        value2 *
          Math.sin(
            (result2 / terrainState.terrainTextureLogicalSize) *
              terrainState.textureFullTurn *
              value3 +
              value4,
          ) +
        value2 *
          0.5 *
          Math.sin(
            (result2 / terrainState.terrainTextureLogicalSize) *
              terrainState.textureFullTurn *
              (value3 * 2 + 1) +
              value4 * 1.7,
          );
      if (result2 === -4) {
        painter.moveTo(result2, result3);
      } else {
        painter.lineTo(result2, result3);
      }
    }
    painter.stroke();
  }
}
