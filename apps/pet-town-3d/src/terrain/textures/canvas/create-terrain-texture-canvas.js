/** Logical canvas scale, palette conversions, wrapped painting primitives and seamless noise sampling. */
import { terrainState } from "../../state.js";
export function createTerrainTextureCanvas() {
  let element = document.createElement(`canvas`);
  element.width = element.height = terrainState.terrainTexturePixelSize;
  let painter = element.getContext(`2d`);
  painter.scale(terrainState.terrainTexturePixelScale, terrainState.terrainTexturePixelScale);
  painter.lineCap = `round`;
  painter.lineJoin = `round`;
  return {
    c: element,
    g: painter,
  };
}
