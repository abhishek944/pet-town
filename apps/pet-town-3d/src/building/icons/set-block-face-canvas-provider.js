/** Block face provider, face cache and isometric hotbar icon generation. */
import { buildingState } from "../state.js";
export function setBlockFaceCanvasProvider(provider) {
  buildingState.blockFaceCanvasProvider = provider;
  buildingState.blockFaceCanvasCache.clear();
}
