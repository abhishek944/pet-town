/** Logical canvas scale, palette conversions, wrapped painting primitives and seamless noise sampling. */
import { terrainState } from "../../state.js";
export function createSampledTextureCanvas(value, value2 = false) {
  let element = document.createElement(`canvas`);
  element.width = element.height = terrainState.terrainTextureLogicalSize;
  let painter = element.getContext(`2d`);
  let imageDataResult = painter.createImageData(
    terrainState.terrainTextureLogicalSize,
    terrainState.terrainTextureLogicalSize,
  );
  let data2 = imageDataResult.data;
  for (let index = 0; index < terrainState.terrainTextureLogicalSize; index++) {
    for (let index2 = 0; index2 < terrainState.terrainTextureLogicalSize; index2++) {
      let valueResult = value(index2 + 0.5, index + 0.5);
      let result = (index * terrainState.terrainTextureLogicalSize + index2) * 4;
      data2[result] = valueResult[0];
      data2[result + 1] = valueResult[1];
      data2[result + 2] = valueResult[2];
      data2[result + 3] = value2 ? valueResult[3] : 255;
    }
  }
  painter.putImageData(imageDataResult, 0, 0);
  return element;
}
