/** Water lifecycle, terrain rebaking, dynamic reflections/refraction, ripples, splashes, and public water API. */

import { waterState } from "../state.js";
export function updateWaterTerrain(frame) {
  ({ uniforms: frame.uniforms, hf: frame.heightfield } = waterState.waterRuntimeState);
  waterState.waterRuntimeState.time += frame.deltaTime;
  frame.time = waterState.waterRuntimeState.time;
  for (
    frame.uniforms.uTime.value = frame.time,
      frame.context.terrain !== waterState.waterRuntimeState.terrainRef &&
        ((waterState.waterRuntimeState.terrainRef = frame.context.terrain),
        frame.heightfield.rebuild(),
        waterState.waterRuntimeState.syncHeightUniforms()),
      waterState.waterRuntimeState.levelOverride == null &&
        waterState.waterRuntimeState.terrainLevel() !== waterState.waterRuntimeState.api.level &&
        waterState.waterRuntimeState.setLevel(waterState.waterRuntimeState.terrainLevel());
    waterState.waterRuntimeState.rebakeTimes.length &&
    frame.time >= waterState.waterRuntimeState.rebakeTimes[0];
  ) {
    waterState.waterRuntimeState.rebakeTimes.shift();
    let checksumResult = frame.heightfield.checksum();
    if (checksumResult !== waterState.waterRuntimeState.bakedSum.v) {
      waterState.waterRuntimeState.bakedSum.v = checksumResult;
      waterState.waterRuntimeState.markDirty();
    }
  }
  frame.dirtyRect = waterState.waterRuntimeState.takeDirtyRect();
  if (waterState.waterRuntimeState.isDirty()) {
    waterState.waterRuntimeState.clearDirty();
    frame.heightfield.bake();
    waterState.waterRuntimeState.syncHeightUniforms();
  } else {
    if (frame.dirtyRect) {
      frame.heightfield.bakeRegion(
        frame.dirtyRect.x0,
        frame.dirtyRect.z0,
        frame.dirtyRect.x1,
        frame.dirtyRect.z1,
      );
      if (waterState.waterRuntimeState.rebakeTimes.length) {
        waterState.waterRuntimeState.bakedSum.v = frame.heightfield.checksum();
      }
    }
  }
  waterState.waterRuntimeState.setRefractMode(
    waterState.waterRuntimeState.refractParam !== `transmission` &&
      !waterState.waterRuntimeState.grabFailed
      ? `grab`
      : `transmission`,
  );
}
