/** Transparent grass fringe, moss and path edge overlay textures. */
import { createSeededRandom } from "../../../math/random/create-seeded-random.js";
import { createTileableTextureNoise } from "../canvas/create-tileable-texture-noise.js";
import { createTerrainTextureCanvas } from "../canvas/create-terrain-texture-canvas.js";
import { terrainState } from "../../state.js";
import { forEachWrappedTexturePosition } from "../canvas/for-each-wrapped-texture-position.js";
import { textureRgbToCss } from "../canvas/texture-rgb-to-css.js";
import { hexToTextureRgb } from "../canvas/hex-to-texture-rgb.js";
import { interpolateTextureRgb } from "../canvas/interpolate-texture-rgb.js";
import { paintWrappedTextureStroke } from "../canvas/paint-wrapped-texture-stroke.js";
import { pickTexturePaletteColor } from "../canvas/pick-texture-palette-color.js";
export function createGrassFringeTexture(
  value,
  value2 = 8434779,
  value3 = 6001219,
  value4 = 25,
  value5 = 84,
  value6 = 16,
  mapValue = [7645778, 9091938, 6263876, 10931314],
  value7 = 3810581,
  value8 = null,
) {
  let seededRandomResult = createSeededRandom(value);
  let tileableTextureNoiseResult = createTileableTextureNoise(value);
  let terrainTextureCanvasResult = createTerrainTextureCanvas();
  let terrainTextureCanvasResult2 = createTerrainTextureCanvas();
  let terrainTextureCanvasResult3 = createTerrainTextureCanvas();
  let result = [0, 1].map((value9) => {
    let seededRandomResult2 = createSeededRandom(value + value9 * 97);
    let values = [];
    for (let index = 0; index < value5; index++) {
      values.push([
        seededRandomResult2() * terrainState.terrainTextureLogicalSize,
        2.5 + seededRandomResult2() * 4,
        3 + seededRandomResult2() * value6 * (seededRandomResult2() < 0.15 ? 1.6 : 1),
        (seededRandomResult2() - 0.5) * 3,
      ]);
    }
    return values;
  });
  let callback = (value10, value11) =>
    value4 +
    5 * tileableTextureNoiseResult.vn(value10, value11 * 50, 10, 4) +
    2 * tileableTextureNoiseResult.vn(value10, value11 * 50 + 7, 40, 4);
  let callback2 = (painter, value12) => {
    for (let index2 = 0; index2 < 2; index2++) {
      let result3 = index2 * 128 + value12;
      painter.beginPath();
      painter.moveTo(-8, result3 - 3);
      for (let result4 = -8; result4 <= 264; result4 += 3) {
        painter.lineTo(result4, result3 + callback(result4, index2));
      }
      painter.lineTo(264, result3 - 3);
      painter.closePath();
      painter.fill();
      for (let [result5, result6, result7, result8] of result[index2]) {
        forEachWrappedTexturePosition(result5, result3 + 40, 40, (value13) => {
          let result9 =
            result3 +
            callback(
              (value13 + terrainState.terrainTextureLogicalSize) %
                terrainState.terrainTextureLogicalSize,
              index2,
            ) -
            2;
          painter.beginPath();
          painter.moveTo(value13 - result6, result9);
          painter.quadraticCurveTo(
            value13 - result6 * 0.3 + result8 * 0.5,
            result9 + result7 * 0.7,
            value13 + result8,
            result9 + result7,
          );
          painter.quadraticCurveTo(
            value13 + result6 * 0.3 + result8 * 0.5,
            result9 + result7 * 0.7,
            value13 + result6,
            result9,
          );
          painter.closePath();
          painter.fill();
        });
      }
      painter.fillRect(-8, index2 * 128 + 104 + value12, 272, 24);
    }
  };
  let g2 = terrainTextureCanvasResult.g;
  g2.fillStyle = textureRgbToCss(hexToTextureRgb(value7));
  g2.fillRect(0, 0, terrainState.terrainTextureLogicalSize, terrainState.terrainTextureLogicalSize);
  for (let index3 = 0; index3 < 2; index3++) {
    let result10 = index3 * 128;
    let linearGradientResult = g2.createLinearGradient(
      0,
      result10,
      0,
      result10 + value4 + value6 + 4,
    );
    linearGradientResult.addColorStop(0, textureRgbToCss(hexToTextureRgb(value2)));
    linearGradientResult.addColorStop(
      0.5,
      textureRgbToCss(
        interpolateTextureRgb(hexToTextureRgb(value2), hexToTextureRgb(value3), 0.55),
      ),
    );
    linearGradientResult.addColorStop(1, textureRgbToCss(hexToTextureRgb(value3)));
    g2.fillStyle = linearGradientResult;
    g2.save();
    g2.beginPath();
    g2.rect(0, result10, terrainState.terrainTextureLogicalSize, 104);
    g2.clip();
    callback2(g2, 0);
    g2.restore();
    g2.fillStyle = textureRgbToCss(hexToTextureRgb(value8 ?? value2));
    g2.fillRect(0, result10 + 104, terrainState.terrainTextureLogicalSize, 24);
  }
  g2.save();
  g2.beginPath();
  g2.rect(0, 0, terrainState.terrainTextureLogicalSize, 104);
  g2.rect(0, 128, terrainState.terrainTextureLogicalSize, 104);
  g2.clip();
  let result2 = mapValue.map(hexToTextureRgb);
  for (let index4 = 0; index4 < 700; index4++) {
    let result11 = seededRandomResult() < 0.5 ? 0 : 1;
    paintWrappedTextureStroke(
      g2,
      seededRandomResult() * terrainState.terrainTextureLogicalSize,
      result11 * 128 + seededRandomResult() * (value4 + 4),
      Math.PI / 2 + (seededRandomResult() - 0.5) * 0.6,
      4 + seededRandomResult() * 8,
      1.4 + seededRandomResult(),
      pickTexturePaletteColor(seededRandomResult, result2),
      0.45 + seededRandomResult() * 0.3,
      (seededRandomResult() - 0.5) * 2,
    );
  }
  g2.restore();
  let g3 = terrainTextureCanvasResult2.g;
  g3.fillStyle = `#000`;
  g3.fillRect(0, 0, terrainState.terrainTextureLogicalSize, terrainState.terrainTextureLogicalSize);
  g3.filter = `blur(6px)`;
  g3.fillStyle = `rgba(255,255,255,0.6)`;
  callback2(g3, 5);
  g3.filter = `blur(${0.6 * terrainState.terrainTexturePixelScale}px)`;
  g3.fillStyle = `#fff`;
  callback2(g3, 0);
  g3.filter = `none`;
  let imageDataResult = g2.getImageData(
    0,
    0,
    terrainState.terrainTexturePixelSize,
    terrainState.terrainTexturePixelSize,
  );
  let imageDataResult2 = g3.getImageData(
    0,
    0,
    terrainState.terrainTexturePixelSize,
    terrainState.terrainTexturePixelSize,
  );
  for (let index5 = 0; index5 < imageDataResult.data.length; index5 += 4) {
    imageDataResult.data[index5 + 3] = imageDataResult2.data[index5];
  }
  terrainTextureCanvasResult3.g.putImageData(imageDataResult, 0, 0);
  return terrainTextureCanvasResult3.c;
}
