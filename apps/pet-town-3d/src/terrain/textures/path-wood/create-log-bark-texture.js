/** Paths, gravel, planks, bark and log end grain textures. */
import { createTerrainTextureCanvas } from "../canvas/create-terrain-texture-canvas.js";
import { createSeededRandom } from "../../../math/random/create-seeded-random.js";
import { createTileableTextureNoise } from "../canvas/create-tileable-texture-noise.js";
import { paintSampledTexture } from "../canvas/paint-sampled-texture.js";
import { paintWrappedTextureStroke } from "../canvas/paint-wrapped-texture-stroke.js";
import { terrainState } from "../../state.js";
import { hexToTextureRgb } from "../canvas/hex-to-texture-rgb.js";
export function createLogBarkTexture(value) {
  let { c: terrainTextureCanvasResult, g: terrainTextureCanvasResult2 } =
    createTerrainTextureCanvas();
  let seededRandomResult = createSeededRandom(value);
  let tileableTextureNoiseResult = createTileableTextureNoise(value);
  paintSampledTexture(terrainTextureCanvasResult2, (value2, value3) => {
    let result = 1 + tileableTextureNoiseResult.fbm(value2, value3, 16, 2, 2) * 0.12;
    return [122 * result, 84 * result, 54 * result];
  });
  for (let index = 0; index < 170; index++) {
    paintWrappedTextureStroke(
      terrainTextureCanvasResult2,
      seededRandomResult() * terrainState.terrainTextureLogicalSize,
      seededRandomResult() * terrainState.terrainTextureLogicalSize,
      Math.PI / 2 + (seededRandomResult() - 0.5) * 0.12,
      18 + seededRandomResult() * 40,
      2 + seededRandomResult() * 2.2,
      hexToTextureRgb(5584416),
      0.5,
      (seededRandomResult() - 0.5) * 3,
    );
  }
  for (let index2 = 0; index2 < 120; index2++) {
    paintWrappedTextureStroke(
      terrainTextureCanvasResult2,
      seededRandomResult() * terrainState.terrainTextureLogicalSize,
      seededRandomResult() * terrainState.terrainTextureLogicalSize,
      Math.PI / 2 + (seededRandomResult() - 0.5) * 0.12,
      10 + seededRandomResult() * 26,
      1.4,
      hexToTextureRgb(10449481),
      0.35,
      (seededRandomResult() - 0.5) * 2,
    );
  }
  return terrainTextureCanvasResult;
}
