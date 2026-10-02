/** Logical canvas scale, palette conversions, wrapped painting primitives and seamless noise sampling. */
import { terrainState } from "../../state.js";
export function prepareTerrainTexturesCanvas() {
  terrainState.terrainTextureLogicalSize = 256;
  terrainState.terrainTexturePixelSize = 512;
  terrainState.terrainTexturePixelScale =
    terrainState.terrainTexturePixelSize / terrainState.terrainTextureLogicalSize;
  terrainState.textureFullTurn = Math.PI * 2;
}
