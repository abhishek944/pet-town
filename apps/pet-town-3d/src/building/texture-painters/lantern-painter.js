/** Seeded procedural canvas painting helpers and block-face art. */

import { drawBlockRoundedRectangle } from "./draw-block-rounded-rectangle.js";
export function createLanternBlockPainter() {
  return {
    lantern: {
      side(painter, size, random) {
        let radialGradientResult = painter.createRadialGradient(
          size / 2,
          size / 2,
          size * 0.05,
          size / 2,
          size / 2,
          size * 0.6,
        );
        radialGradientResult.addColorStop(0, `#fff7cf`);
        radialGradientResult.addColorStop(0.55, `#ffd36b`);
        radialGradientResult.addColorStop(1, `#f5a443`);
        painter.fillStyle = radialGradientResult;
        painter.fillRect(0, 0, size, size);
        painter.strokeStyle = `#6b4a2e`;
        painter.lineWidth = size * 0.14;
        painter.strokeRect(0, 0, size, size);
        painter.lineWidth = size * 0.05;
        painter.beginPath();
        painter.moveTo(size / 2, 0);
        painter.lineTo(size / 2, size);
        painter.moveTo(0, size / 2);
        painter.lineTo(size, size / 2);
        painter.stroke();
        painter.fillStyle = `rgba(255,255,255,.55)`;
        drawBlockRoundedRectangle(
          painter,
          size * 0.14,
          size * 0.14,
          size * 0.1,
          size * 0.28,
          size * 0.05,
        );
        painter.fill();
      },
      top(painter, size, random) {
        painter.fillStyle = `#6b4a2e`;
        painter.fillRect(0, 0, size, size);
        painter.fillStyle = `#80593a`;
        drawBlockRoundedRectangle(
          painter,
          size * 0.1,
          size * 0.1,
          size * 0.8,
          size * 0.8,
          size * 0.12,
        );
        painter.fill();
        let radialGradientResult = painter.createRadialGradient(
          size / 2,
          size / 2,
          0,
          size / 2,
          size / 2,
          size * 0.3,
        );
        radialGradientResult.addColorStop(0, `#fff3b8`);
        radialGradientResult.addColorStop(1, `rgba(255,200,90,0)`);
        painter.fillStyle = radialGradientResult;
        painter.fillRect(0, 0, size, size);
      },
    },
  };
}
