/** Guarded initialization and per-frame vegetation updates including props, water bobbing, quality and wind. */
import { vegetationState } from "../state.js";
import { isVegetationTerrainReady } from "../terrain-updates/is-vegetation-terrain-ready.js";
import { subscribeVegetationTerrainChanges } from "../terrain-updates/subscribe-vegetation-terrain-changes.js";
import { rebuildVegetationWorld } from "../terrain-updates/rebuild-vegetation-world.js";
import { getVegetationTerrainRevision } from "../terrain-updates/get-vegetation-terrain-revision.js";
import { resampleDirtyVegetationCells } from "../terrain-updates/resample-dirty-vegetation-cells.js";
export function updateVegetationTerrain(frame) {
  if (isVegetationTerrainReady(frame.context)) {
    if (
      !vegetationState.vegetationRuntimeState.built &&
      frame.context.time > vegetationState.vegetationRuntimeState.tries * 0.5
    ) {
      vegetationState.vegetationRuntimeState.tries++;
      subscribeVegetationTerrainChanges(frame.context);
      rebuildVegetationWorld(frame.context);
    } else {
      if (
        vegetationState.vegetationRuntimeState.built &&
        frame.context.terrain !== vegetationState.vegetationRuntimeState.terrainRef
      ) {
        subscribeVegetationTerrainChanges(frame.context);
        vegetationState.vegetationRuntimeState.rebuildAt = frame.context.time + 0.1;
        vegetationState.vegetationRuntimeState.terrainRef = frame.context.terrain;
        vegetationState.vegetationRuntimeState.terrainVersion = getVegetationTerrainRevision(
          frame.context.terrain,
        );
      } else {
        if (
          vegetationState.vegetationRuntimeState.built &&
          getVegetationTerrainRevision(frame.context.terrain) !==
            vegetationState.vegetationRuntimeState.terrainVersion
        ) {
          vegetationState.vegetationRuntimeState.terrainVersion = getVegetationTerrainRevision(
            frame.context.terrain,
          );
          if (!vegetationState.vegetationRuntimeState.fineEvents) {
            vegetationState.vegetationRuntimeState.rebuildAt = frame.context.time + 0.25;
          }
        }
      }
    }
  }
  if (
    vegetationState.vegetationRuntimeState.rebuildAt >= 0 &&
    frame.context.time >= vegetationState.vegetationRuntimeState.rebuildAt
  ) {
    vegetationState.vegetationRuntimeState.rebuildAt = -1;
    vegetationState.vegetationRuntimeState.dirty.clear();
    rebuildVegetationWorld(frame.context);
  }
  resampleDirtyVegetationCells();
}
