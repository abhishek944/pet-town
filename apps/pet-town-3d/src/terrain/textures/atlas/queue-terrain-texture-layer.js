/** Bump encoding, texture array generation and incremental custom texture registration. */
import { createTerrainTextureCanvas } from "../canvas/create-terrain-texture-canvas.js";
import { terrainState } from "../../state.js";
import { encodeTextureHeightAlpha } from "./encode-texture-height-alpha.js";
export function queueTerrainTextureLayer(
  countValue,
  surface,
  { bump: value = 0.8, emit: value2 = 0, seam: value3 = 1 } = {},
) {
  let result = countValue.count + (countValue.pending?.length ?? 0);
  if (result >= 64) {
    return null;
  }
  let { c: terrainTextureCanvasResult, g: terrainTextureCanvasResult2 } =
    createTerrainTextureCanvas();
  terrainTextureCanvasResult2.imageSmoothingEnabled = true;
  for (let [result2, result3] of [
    [0, 0],
    [128, 0],
    [0, 128],
    [128, 128],
  ]) {
    terrainTextureCanvasResult2.drawImage(
      surface,
      0,
      0,
      surface.width,
      surface.height,
      result2,
      result3,
      128,
      128,
    );
  }
  let uint8ClampedArray = new Uint8ClampedArray(
    terrainTextureCanvasResult
      .getContext(`2d`)
      .getImageData(
        0,
        0,
        terrainState.terrainTexturePixelSize,
        terrainState.terrainTexturePixelSize,
      ).data,
  );
  encodeTextureHeightAlpha(uint8ClampedArray, 1);
  let byteBuffer = new Uint8Array(
    terrainState.terrainTexturePixelSize * terrainState.terrainTexturePixelSize * 4,
  );
  for (let index = 0; index < terrainState.terrainTexturePixelSize; index++) {
    byteBuffer.set(
      uint8ClampedArray.subarray(
        (511 - index) * terrainState.terrainTexturePixelSize * 4,
        (terrainState.terrainTexturePixelSize - index) * terrainState.terrainTexturePixelSize * 4,
      ),
      index * terrainState.terrainTexturePixelSize * 4,
    );
  }
  (countValue.pending ??= []).push(byteBuffer);
  countValue.layers[result] = {
    cnv: terrainTextureCanvasResult,
    bump: value,
    isOverlay: false,
  };
  countValue.bump[result] = value;
  countValue.seam[result] = value3;
  countValue.emit[result] = value2;
  return result;
}
