/** Water lifecycle, terrain rebaking, dynamic reflections/refraction, ripples, splashes, and public water API. */
/** Water lifecycle, terrain rebaking, dynamic reflections/refraction, ripples, splashes, and public water API. */

export function watchWaterTerrain(state) {
  state.terrainDirty = false;
  state.dirtyRect = null;
  state.markDirty = (position2) => {
    let result32 = position2?.x ?? position2?.detail?.x;
    let result33 = position2?.z ?? position2?.detail?.z;
    if (Number.isFinite(result32) && Number.isFinite(result33)) {
      let result34 = (state.dirtyRect ??= {
        x0: 1 / 0,
        z0: 1 / 0,
        x1: -1 / 0,
        z1: -1 / 0,
      });
      result34.x0 = Math.min(result34.x0, Math.floor(result32));
      result34.z0 = Math.min(result34.z0, Math.floor(result33));
      result34.x1 = Math.max(result34.x1, Math.floor(result32) + 1);
      result34.z1 = Math.max(result34.z1, Math.floor(result33) + 1);
    } else {
      state.terrainDirty = true;
    }
  };
  state.terrain = state.context.terrain;
  if (state.terrain) {
    if (typeof state.terrain.onChange == `function`) {
      try {
        state.terrain.onChange(state.markDirty);
      } catch {}
    } else if (
      typeof state.terrain.setBlock == `function` &&
      !state.terrain.setBlock.__waterHooked
    ) {
      let setBlock2 = state.terrain.setBlock;
      state.terrain.setBlock = function (...value5) {
        let applyResult = setBlock2.apply(this, value5);
        state.markDirty({
          x: value5[0],
          z: value5[2],
        });
        return applyResult;
      };
      state.terrain.setBlock.__waterHooked = true;
    }
  }
  addEventListener?.(`terrain:change`, state.markDirty);
  state.rebakeTimes = [0.5, 2, 5];
  state.bakedChecksum = {
    v: state.heightfield.checksum(),
  };
}
