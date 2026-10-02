/** Terrain access, solid-block queries and raycast normalization with voxel-grid fallback. */
import { buildingState } from "../state.js";
import { normalizeTerrainRaycastHit } from "./normalize-terrain-raycast-hit.js";
import { raycastVoxelGrid } from "./raycast-voxel-grid.js";
export function raycastBuildingTerrain(origin, direction, maximumDistance) {
  let result = null;
  if (typeof buildingState.buildingTerrain?.raycast == `function`) {
    try {
      result = normalizeTerrainRaycastHit(
        buildingState.buildingTerrain.raycast(origin.clone(), direction.clone(), maximumDistance),
        origin,
        direction,
      );
    } catch {
      result = null;
    }
  }
  if (result && buildingState.buildingRuntime.nonSolid.has(result.id)) {
    result = null;
  }
  return (
    result ??
    (buildingState.buildingRuntime.blockAtWorks && buildingState.buildingTerrain?.raycast
      ? null
      : raycastVoxelGrid(origin, direction, maximumDistance))
  );
}
