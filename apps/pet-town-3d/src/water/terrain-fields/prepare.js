/** Terrain-aware bed, coastal distance, openness and river current textures with incremental rebaking. */
import { waterState } from "../state.js";
export function prepareWaterTerrainFields() {
  waterState.waterFieldBorderPadding = 48;
  waterState.waterFieldDeepDepth = 40;
  waterState.waterCoastDistanceLimit = 40;
}
