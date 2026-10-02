/** Block face provider, face cache and isometric hotbar icon generation. */
import { buildingState } from "../state.js";
import { createBlockTextureRandom } from "../texture-painters/create-block-texture-random.js";
import { hashBlockTextureSeed } from "../texture-painters/hash-block-texture-seed.js";
import { applyBlockFaceGrain } from "./apply-block-face-grain.js";
export function createBlockFaceCanvas(key, face = `side`, size = 64) {
  let cacheKey = key + `:` + face + `:` + size;
  if (buildingState.blockFaceCanvasCache.has(cacheKey)) {
    return buildingState.blockFaceCanvasCache.get(cacheKey);
  }
  let canvas = document.createElement(`canvas`);
  canvas.width = canvas.height = size;
  let painter = canvas.getContext(`2d`, {
    willReadFrequently: true,
  });
  let providedCanvas;
  try {
    providedCanvas = buildingState.blockFaceCanvasProvider?.(key, face);
  } catch {
    providedCanvas = null;
  }
  if (providedCanvas) {
    painter.drawImage(providedCanvas, 0, 0, size, size);
    buildingState.blockFaceCanvasCache.set(cacheKey, canvas);
    return canvas;
  }
  let facePainters = buildingState.blockFacePainters[key] ?? buildingState.blockFacePainters.stone;
  (
    facePainters[face] ??
    (face === `bottom` || face === `side`
      ? (facePainters.side ?? facePainters.top)
      : (facePainters.top ?? facePainters.side))
  )(painter, size, createBlockTextureRandom(hashBlockTextureSeed(key + face)));
  applyBlockFaceGrain(
    painter,
    size,
    key,
    createBlockTextureRandom(hashBlockTextureSeed(key + face + `grain`)),
  );
  buildingState.blockFaceCanvasCache.set(cacheKey, canvas);
  return canvas;
}
