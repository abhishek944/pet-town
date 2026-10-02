/** Seeded procedural canvas painting helpers and block-face art. */
import { buildingState } from "../state.js";
import { drawBlockTexturePatches } from "./draw-block-texture-patches.js";
import { drawGrassBlockEdge } from "./draw-grass-block-edge.js";
import { shadeBlockHexColor } from "./shade-block-hex-color.js";
import { drawBlockTextureSpeckles } from "./draw-block-texture-speckles.js";
export function createFoliageBlockPainters() {
  return {
    leaves: {
      top(painter, size, random) {
        painter.fillStyle = `#4f9d42`;
        painter.fillRect(0, 0, size, size);
        for (let index = 0; index < 26; index++) {
          painter.fillStyle = shadeBlockHexColor(`#62b64f`, (random() - 0.45) * 0.3);
          painter.beginPath();
          painter.arc(random() * size, random() * size, size * (0.07 + random() * 0.08), 0, 7);
          painter.fill();
        }
        drawBlockTextureSpeckles(painter, size, random, `rgba(210,255,170,.6)`, 10, 0.02);
      },
    },
    flower: {
      top(painter, size, random) {
        painter.fillStyle = `#71c95a`;
        painter.fillRect(0, 0, size, size);
        drawBlockTexturePatches(painter, size, random, `#71c95a`, 10, 0.12);
        let values = [`#ff9ec0`, `#ffd95e`, `#ffffff`, `#c9a4ff`, `#ff8a7a`];
        for (let [result, result2] of [
          [0.24, 0.26],
          [0.72, 0.2],
          [0.5, 0.52],
          [0.2, 0.76],
          [0.78, 0.74],
          [0.46, 0.88],
          [0.9, 0.46],
          [0.08, 0.5],
        ]) {
          let result3 = (result + (random() - 0.5) * 0.08) * size;
          let result4 = (result2 + (random() - 0.5) * 0.08) * size;
          let result5 = size * (0.055 + random() * 0.02);
          let result6 = values[(random() * values.length) | 0];
          painter.fillStyle = result6;
          for (let index = 0; index < 5; index++) {
            let result7 = (index / 5) * 6.283 + random();
            painter.beginPath();
            painter.arc(
              result3 + Math.cos(result7) * result5,
              result4 + Math.sin(result7) * result5,
              result5 * 0.85,
              0,
              7,
            );
            painter.fill();
          }
          painter.fillStyle = result6 === `#ffd95e` ? `#ff9a3c` : `#ffd95e`;
          painter.beginPath();
          painter.arc(result3, result4, result5 * 0.6, 0, 7);
          painter.fill();
        }
      },
      side(painter, size, random) {
        buildingState.blockFacePainters.flower.top(painter, size, random);
        painter.fillStyle = `rgba(0,0,0,0)`;
        let result = size * 0.62;
        painter.save();
        painter.beginPath();
        painter.rect(0, result, size, size - result);
        painter.clip();
        buildingState.blockFacePainters.dirt.top(painter, size, random);
        painter.restore();
        drawGrassBlockEdge(painter, size, random, `#71c95a`, 0.62);
      },
      bottom(painter, size, random) {
        buildingState.blockFacePainters.dirt.top(painter, size, random);
      },
    },
  };
}
