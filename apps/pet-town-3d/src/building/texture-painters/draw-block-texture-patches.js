/** Seeded procedural canvas painting helpers and block-face art. */
import { shadeBlockHexColor } from "./shade-block-hex-color.js";
export function drawBlockTexturePatches(
  painter,
  size,
  random,
  color,
  count,
  variation,
  minimumRadius = 0.08,
  maximumRadius = 0.2,
) {
  for (let index = 0; index < count; index++) {
    painter.fillStyle = shadeBlockHexColor(color, (random() - 0.5) * 2 * variation);
    painter.globalAlpha = 0.55;
    painter.beginPath();
    painter.arc(
      random() * size,
      random() * size,
      size * (minimumRadius + random() * (maximumRadius - minimumRadius)),
      0,
      7,
    );
    painter.fill();
  }
  painter.globalAlpha = 1;
}
