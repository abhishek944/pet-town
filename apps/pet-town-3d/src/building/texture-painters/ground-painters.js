/** Seeded procedural canvas painting helpers and block-face art. */
import { buildingState } from "../state.js";
import { drawBlockTexturePatches } from "./draw-block-texture-patches.js";
import { drawGrassBlockEdge } from "./draw-grass-block-edge.js";
import { shadeBlockHexColor } from "./shade-block-hex-color.js";
import { drawBlockRoundedRectangle } from "./draw-block-rounded-rectangle.js";
import { drawBlockTextureSpeckles } from "./draw-block-texture-speckles.js";
export function createGroundBlockPainters() {
  return {
    grass: {
      top(painter, size, random) {
        painter.fillStyle = `#86d464`;
        painter.fillRect(0, 0, size, size);
        drawBlockTexturePatches(painter, size, random, `#86d464`, 14, 0.12);
        painter.strokeStyle = `#a8e585`;
        painter.lineWidth = size * 0.03;
        painter.lineCap = `round`;
        for (let index = 0; index < 16; index++) {
          let result = random() * size;
          let result2 = random() * size;
          painter.beginPath();
          painter.moveTo(result, result2);
          painter.quadraticCurveTo(
            result + size * 0.02,
            result2 - size * 0.05,
            result + size * 0.05,
            result2 - size * 0.08,
          );
          painter.stroke();
        }
      },
      side(painter, size, random) {
        buildingState.blockFacePainters.dirt.top(painter, size, random);
        drawGrassBlockEdge(painter, size, random, `#86d464`);
      },
      bottom(painter, size, random) {
        buildingState.blockFacePainters.dirt.top(painter, size, random);
      },
    },
    dirt: {
      top(painter, size, random) {
        painter.fillStyle = `#a9774a`;
        painter.fillRect(0, 0, size, size);
        drawBlockTexturePatches(painter, size, random, `#a9774a`, 12, 0.1);
        for (let index = 0; index < 9; index++) {
          painter.fillStyle = random() < 0.5 ? `#8c6139` : `#c29066`;
          painter.beginPath();
          painter.ellipse(
            random() * size,
            random() * size,
            size * 0.045,
            size * 0.032,
            random() * 3,
            0,
            7,
          );
          painter.fill();
        }
      },
    },
    stone: {
      top(painter, size, random) {
        painter.fillStyle = `#8f8a82`;
        painter.fillRect(0, 0, size, size);
        let result = size / 3;
        for (let index = 0; index < 3; index++) {
          let result2 = -random() * size * 0.3;
          for (; result2 < size;) {
            let result3 = size * (0.3 + random() * 0.22);
            let shadeBlockHexColorResult = shadeBlockHexColor(`#b3aea5`, (random() - 0.5) * 0.16);
            drawBlockRoundedRectangle(
              painter,
              result2 + size * 0.03,
              index * result + size * 0.03,
              result3 - size * 0.06,
              result - size * 0.06,
              size * 0.09,
            );
            painter.fillStyle = shadeBlockHexColorResult;
            painter.fill();
            painter.fillStyle = `rgba(255,255,255,.28)`;
            drawBlockRoundedRectangle(
              painter,
              result2 + size * 0.07,
              index * result + size * 0.06,
              result3 * 0.45,
              size * 0.045,
              size * 0.03,
            );
            painter.fill();
            result2 += result3;
          }
        }
      },
    },
    sand: {
      top(painter, size, random) {
        painter.fillStyle = `#f3dfa6`;
        painter.fillRect(0, 0, size, size);
        drawBlockTexturePatches(painter, size, random, `#f3dfa6`, 10, 0.07);
        painter.strokeStyle = `rgba(214,184,120,.55)`;
        painter.lineWidth = size * 0.025;
        painter.lineCap = `round`;
        for (let index = 0; index < 3; index++) {
          let result = size * (0.22 + index * 0.3 + random() * 0.06);
          painter.beginPath();
          painter.moveTo(size * 0.1, result);
          painter.bezierCurveTo(
            size * 0.35,
            result - size * 0.06,
            size * 0.6,
            result + size * 0.06,
            size * 0.9,
            result,
          );
          painter.stroke();
        }
        drawBlockTextureSpeckles(painter, size, random, `#e2c686`, 14, 0.018);
        drawBlockTextureSpeckles(painter, size, random, `#fff4d2`, 10, 0.018);
      },
    },
  };
}
