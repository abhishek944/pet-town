/** Block face provider, face cache and isometric hotbar icon generation. */
import { buildingState } from "../state.js";
export function prepareBuildingIcons() {
  buildingState.blockFaceCanvasCache = new Map();
  buildingState.blockFaceCanvasProvider = null;
}
