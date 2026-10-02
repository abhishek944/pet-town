/** Seeded procedural canvas painting helpers and block-face art. */

import { drawBlockTexturePatches } from "./draw-block-texture-patches.js";
import { shadeBlockHexColor } from "./shade-block-hex-color.js";
import { drawBlockRoundedRectangle } from "./draw-block-rounded-rectangle.js";
export function createTimberBlockPainters() {
  return {
    planks: {
      top(painter, size, random) {
        let result = size / 4;
        for (let index = 0; index < 4; index++) {
          painter.fillStyle = shadeBlockHexColor(`#dca56a`, (random() - 0.5) * 0.12);
          painter.fillRect(0, index * result, size, result);
          painter.strokeStyle = shadeBlockHexColor(`#dca56a`, -0.12);
          painter.lineWidth = size * 0.014;
          painter.globalAlpha = 0.6;
          for (let index2 = 0; index2 < 2; index2++) {
            let result3 = index * result + result * (0.3 + random() * 0.4);
            painter.beginPath();
            painter.moveTo(0, result3);
            painter.bezierCurveTo(
              size * 0.3,
              result3 + size * 0.015,
              size * 0.6,
              result3 - size * 0.015,
              size,
              result3,
            );
            painter.stroke();
          }
          painter.globalAlpha = 1;
          painter.fillStyle = `#b07a45`;
          painter.fillRect(0, index * result + result - size * 0.03, size, size * 0.03);
          painter.fillStyle = `rgba(255,255,255,.25)`;
          painter.fillRect(0, index * result, size, size * 0.02);
          let result2 = (index % 2) * 0.5 + 0.25;
          painter.fillStyle = `#a06b3a`;
          painter.fillRect(size * result2 - size * 0.012, index * result, size * 0.024, result);
          painter.fillStyle = `#8a5a30`;
          for (let result4 of [size * 0.08, size * 0.92]) {
            painter.beginPath();
            painter.arc(result4, index * result + result * 0.5, size * 0.018, 0, 7);
            painter.fill();
          }
        }
      },
    },
    log: {
      side(painter, size, random) {
        painter.fillStyle = `#8d5d36`;
        painter.fillRect(0, 0, size, size);
        for (let index = 0; index < 7; index++) {
          let result = ((index + 0.3 + random() * 0.4) * size) / 7;
          painter.fillStyle = index % 2 ? `#7a4d2b` : `#a06c42`;
          drawBlockRoundedRectangle(
            painter,
            result - size * 0.025,
            -size * 0.1 + random() * size * 0.2,
            size * 0.05,
            size * (0.6 + random() * 0.5),
            size * 0.025,
          );
          painter.fill();
        }
        drawBlockTexturePatches(painter, size, random, `#8d5d36`, 5, 0.1, 0.05, 0.1);
      },
      top(painter, size, random) {
        painter.fillStyle = `#8d5d36`;
        painter.fillRect(0, 0, size, size);
        let result = size / 2;
        let result2 = size / 2;
        for (let result3 = size * 0.44, index = 0; result3 > 0; result3 -= size * 0.08, index++) {
          painter.fillStyle = index % 2 ? `#d7aa6e` : `#e6c08a`;
          painter.beginPath();
          painter.arc(result + (random() - 0.5) * size * 0.02, result2, result3, 0, 7);
          painter.fill();
        }
        painter.fillStyle = `#c9965c`;
        painter.beginPath();
        painter.arc(result, result2, size * 0.05, 0, 7);
        painter.fill();
      },
    },
  };
}
