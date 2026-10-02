/** Seeded procedural canvas painting helpers and block-face art. */
import { buildingState } from "../state.js";
import { shadeBlockHexColor } from "./shade-block-hex-color.js";
import { drawBlockRoundedRectangle } from "./draw-block-rounded-rectangle.js";
export function createMasonryBlockPainters() {
  return {
    brick: {
      top(painter, size, random) {
        painter.fillStyle = `#f1e3cf`;
        painter.fillRect(0, 0, size, size);
        let result = size / 4;
        let result2 = size / 2;
        let result3 = size * 0.035;
        for (let index = 0; index < 4; index++) {
          for (let result4 = -1; result4 < 3; result4++) {
            let result5 = result4 * result2 + ((index % 2) * result2) / 2;
            painter.fillStyle = shadeBlockHexColor(`#d8735a`, (random() - 0.5) * 0.16);
            drawBlockRoundedRectangle(
              painter,
              result5 + result3 / 2,
              index * result + result3 / 2,
              result2 - result3,
              result - result3,
              size * 0.035,
            );
            painter.fill();
            painter.fillStyle = `rgba(255,255,255,.22)`;
            drawBlockRoundedRectangle(
              painter,
              result5 + result3,
              index * result + result3,
              result2 - result3 * 2.5,
              size * 0.03,
              size * 0.015,
            );
            painter.fill();
          }
        }
      },
    },
    glass: {
      top(painter, size, random) {
        painter.clearRect(0, 0, size, size);
        painter.fillStyle = `rgba(160,220,255,.6)`;
        painter.fillRect(0, 0, size, size);
        painter.strokeStyle = `rgba(255,255,255,.95)`;
        painter.lineWidth = size * 0.09;
        painter.strokeRect(0, 0, size, size);
        painter.strokeStyle = `rgba(160,210,235,.9)`;
        painter.lineWidth = size * 0.025;
        painter.strokeRect(size * 0.07, size * 0.07, size * 0.86, size * 0.86);
        painter.strokeStyle = `rgba(255,255,255,.8)`;
        painter.lineCap = `round`;
        painter.lineWidth = size * 0.06;
        painter.beginPath();
        painter.moveTo(size * 0.22, size * 0.52);
        painter.lineTo(size * 0.52, size * 0.22);
        painter.stroke();
        painter.lineWidth = size * 0.035;
        painter.beginPath();
        painter.moveTo(size * 0.3, size * 0.7);
        painter.lineTo(size * 0.7, size * 0.3);
        painter.stroke();
      },
    },
    roof: {
      top(painter, size, random) {
        painter.fillStyle = `#b8473a`;
        painter.fillRect(0, 0, size, size);
        let result = size / 3;
        let result2 = size / 2;
        for (let result3 = -1; result3 < 3; result3++) {
          for (let result4 = -1; result4 <= 2; result4++) {
            let result5 = result4 * result2 + (result3 % 2 ? result2 / 2 : 0);
            let result6 = result3 * result;
            let linearGradientResult = painter.createLinearGradient(
              0,
              result6,
              0,
              result6 + result * 1.05,
            );
            let shadeBlockHexColorResult = shadeBlockHexColor(`#e2654f`, (random() - 0.5) * 0.08);
            linearGradientResult.addColorStop(0, shadeBlockHexColor(`#e2654f`, 0.12));
            linearGradientResult.addColorStop(0.7, shadeBlockHexColorResult);
            linearGradientResult.addColorStop(1, shadeBlockHexColor(`#e2654f`, -0.18));
            painter.fillStyle = linearGradientResult;
            painter.beginPath();
            painter.moveTo(result5 + size * 0.01, result6);
            painter.lineTo(result5 + result2 - size * 0.01, result6);
            painter.lineTo(result5 + result2 - size * 0.01, result6 + result * 0.5);
            painter.arc(
              result5 + result2 / 2,
              result6 + result * 0.5,
              result2 / 2 - size * 0.01,
              0,
              Math.PI,
            );
            painter.closePath();
            painter.fill();
            painter.strokeStyle = `#a63e33`;
            painter.lineWidth = size * 0.028;
            painter.stroke();
            painter.strokeStyle = `rgba(255,230,210,.45)`;
            painter.lineWidth = size * 0.025;
            painter.lineCap = `round`;
            painter.beginPath();
            painter.arc(
              result5 + result2 / 2,
              result6 + result * 0.42,
              result2 * 0.3,
              Math.PI * 0.72,
              Math.PI * 0.95,
            );
            painter.stroke();
          }
        }
      },
      bottom(painter, size, random) {
        painter.fillStyle = `#9a6a45`;
        painter.fillRect(0, 0, size, size);
        buildingState.blockFacePainters.planks.top(painter, size, random);
        painter.fillStyle = `rgba(80,40,20,.25)`;
        painter.fillRect(0, 0, size, size);
      },
    },
  };
}
