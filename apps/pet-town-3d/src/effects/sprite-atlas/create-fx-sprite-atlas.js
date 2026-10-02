/** Procedural signed-distance sprite atlas for particles, emotes, glow and smoke. */
import * as THREE from "three";
import { effectsState } from "../state.js";
import { clampFxAtlasValue } from "./clamp-fx-atlas-value.js";
export function createFxSpriteAtlas() {
  let byteBuffer = new Uint8Array(1048576);
  for (let index = 0; index < effectsState.fxAtlasShapeSamplers.length; index++) {
    let result = effectsState.fxAtlasShapeSamplers[index];
    let result2 = (index % 4) * effectsState.fxAtlasTileSize;
    let result3 = Math.floor(index / 4) * effectsState.fxAtlasTileSize;
    for (let index2 = 0; index2 < effectsState.fxAtlasTileSize; index2++) {
      for (let index3 = 0; index3 < effectsState.fxAtlasTileSize; index3++) {
        let index4 = 0;
        let index5 = 0;
        let index6 = 0;
        for (let index7 = 0; index7 < 2; index7++) {
          for (let index8 = 0; index8 < 2; index8++) {
            let [resultResult, resultResult2, resultResult3] = result(
              ((index3 - 4 + (index8 + 0.5) / 2) / 120) * 2 - 1,
              ((index2 - 4 + (index7 + 0.5) / 2) / 120) * 2 - 1,
              0.016666666666666666,
            );
            index4 += resultResult;
            index5 += resultResult2;
            index6 += resultResult3;
          }
        }
        let result4 = ((result3 + index2) * 512 + result2 + index3) * 4;
        byteBuffer[result4] = clampFxAtlasValue(index4 / 4) * 255;
        byteBuffer[result4 + 1] = clampFxAtlasValue(index5 / 4) * 255;
        byteBuffer[result4 + 2] = 255;
        byteBuffer[result4 + 3] = clampFxAtlasValue(index6 / 4) * 255;
      }
    }
  }
  let dataTexture = new THREE.DataTexture(
    byteBuffer,
    512,
    512,
    THREE.RGBAFormat,
    THREE.UnsignedByteType,
  );
  dataTexture.generateMipmaps = true;
  dataTexture.minFilter = THREE.LinearMipmapLinearFilter;
  dataTexture.magFilter = THREE.LinearFilter;
  dataTexture.colorSpace = ``;
  dataTexture.needsUpdate = true;
  return dataTexture;
}
