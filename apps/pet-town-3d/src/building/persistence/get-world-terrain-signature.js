/** Serialize, save, restore and reset player block changes. */
import { buildingState } from "../state.js";
export function getWorldTerrainSignature() {
  return [
    buildingState.buildingTerrain?.size,
    buildingState.buildingTerrain?.height,
    buildingState.buildingTerrain?.waterLevel,
    buildingState.buildingTerrain?.spawn &&
      Math.round(buildingState.buildingTerrain.spawn.x) +
        `:` +
        Math.round(buildingState.buildingTerrain.spawn.z),
  ].join(`|`);
}
