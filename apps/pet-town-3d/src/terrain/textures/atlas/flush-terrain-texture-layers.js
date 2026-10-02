/** Bump encoding, texture array generation and incremental custom texture registration. */
import { terrainState } from "../../state.js";
import { createTerrainArrayTexture } from "./create-terrain-array-texture.js";
export function flushTerrainTextureLayers(pendingValue) {
  if (!pendingValue.pending?.length) {
    return false;
  }
  let result = terrainState.terrainTexturePixelSize * terrainState.terrainTexturePixelSize * 4;
  let result2 = pendingValue.count + pendingValue.pending.length;
  let byteBuffer = new Uint8Array(result * result2);
  byteBuffer.set(pendingValue.data);
  pendingValue.pending.forEach((value, value2) =>
    byteBuffer.set(value, (pendingValue.count + value2) * result),
  );
  let texture2 = pendingValue.texture;
  pendingValue.texture = createTerrainArrayTexture(byteBuffer, result2, pendingValue.renderer);
  pendingValue.data = byteBuffer;
  pendingValue.count = result2;
  pendingValue.pending = [];
  texture2.dispose();
  return true;
}
