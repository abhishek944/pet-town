/** Isometric canvas thumbnails for terrain blocks. */
import { terrainState } from "../../state.js";
export function createTerrainBlockIcon(layersValue, topValue, value = 64) {
  let element = document.createElement(`canvas`);
  element.width = element.height = value;
  let painter = element.getContext(`2d`);
  let callback = (value2) => layersValue.layers[value2].cnv;
  let result = value * 0.44;
  let result2 = result * 0.5;
  let result3 = value * 0.5;
  let result4 = value / 2;
  let result5 = value * 0.03;
  let callback2 = (value3, value4, value5, value6) => {
    painter.save();
    painter.setTransform(...value5);
    painter.drawImage(
      callback(value3),
      0,
      0,
      terrainState.terrainTexturePixelSize / 2,
      terrainState.terrainTexturePixelSize / 2,
      0,
      0,
      1,
      1,
    );
    if (value4 != null) {
      painter.drawImage(
        callback(value4),
        0,
        0,
        terrainState.terrainTexturePixelSize / 2,
        (terrainState.terrainTexturePixelSize / 2) * 0.7,
        0,
        0,
        1,
        0.7,
      );
    }
    if (value6) {
      painter.fillStyle = `rgba(30,24,40,${value6})`;
      painter.fillRect(0, 0, 1, 1);
    }
    painter.restore();
  };
  callback2(
    topValue.top,
    topValue.topOver,
    [result, -result2, result, result2, result4 - result, result5 + result2],
    0,
  );
  callback2(
    topValue.side,
    topValue.exposedSideOver,
    [result, result2, 0, result3, result4 - result, result5 + result2],
    0.12,
  );
  callback2(
    topValue.side,
    topValue.exposedSideOver,
    [result, -result2, 0, result3, result4, result5 + 2 * result2],
    0.28,
  );
  return element;
}
