/** Paths, gravel, planks, bark and log end grain textures. */
import { createTerrainTextureCanvas } from "../canvas/create-terrain-texture-canvas.js";
import { createSeededRandom } from "../../../math/random/create-seeded-random.js";
import { createTileableTextureNoise } from "../canvas/create-tileable-texture-noise.js";
import { paintSampledTexture } from "../canvas/paint-sampled-texture.js";
import { hexToTextureRgb } from "../canvas/hex-to-texture-rgb.js";
import { paintTexturePebble } from "../canvas/paint-texture-pebble.js";
import { terrainState } from "../../state.js";
import { pickTexturePaletteColor } from "../canvas/pick-texture-palette-color.js";
export function createGravelTexture(value) {
  let { c: terrainTextureCanvasResult, g: terrainTextureCanvasResult2 } =
    createTerrainTextureCanvas();
  let seededRandomResult = createSeededRandom(value);
  let tileableTextureNoiseResult = createTileableTextureNoise(value);
  paintSampledTexture(terrainTextureCanvasResult2, (value2, value3) => {
    let result2 = 1 + tileableTextureNoiseResult.fbm(value2, value3, 8, 2) * 0.1;
    return [118 * result2, 110 * result2, 100 * result2];
  });
  let result = [10722450, 9406591, 12103844, 10259062, 8354420, 12760998].map(hexToTextureRgb);
  for (let index = 0; index < 520; index++) {
    let result3 = 2 + seededRandomResult() * 3.4;
    paintTexturePebble(
      terrainTextureCanvasResult2,
      seededRandomResult,
      seededRandomResult() * terrainState.terrainTextureLogicalSize,
      seededRandomResult() * terrainState.terrainTextureLogicalSize,
      result3,
      result3 * (0.65 + seededRandomResult() * 0.3),
      pickTexturePaletteColor(seededRandomResult, result),
    );
  }
  return terrainTextureCanvasResult;
}
