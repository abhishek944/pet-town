/** Terrain-aware bed, coastal distance, openness and river current textures with incremental rebaking. */
/** Terrain-aware bed, coastal distance, openness and river current textures with incremental rebaking. */

import { waterState } from "../state.js";
export function exposeWaterFields(state) {
  return {
    get texture() {
      return state.heightTexture;
    },
    get texture2() {
      return state.waterTexture;
    },
    get rect() {
      return state.rect;
    },
    get bounds() {
      return state.bounds;
    },
    get blockMode() {
      return state.blockMode;
    },
    bake() {
      state.detectBlockMode();
      state.bakeAll();
    },
    bakeRegion: state.bakeRegion,
    checksum() {
      let index28 = 0;
      for (let z02 = state.bounds.z0; z02 < state.bounds.z1; z02 += 3) {
        for (let x02 = state.bounds.x0; x02 < state.bounds.x1; x02 += 3) {
          let callback2Result3 = state.sampleTerrainTop(x02, z02);
          index28 =
            (index28 * 31 +
              (Number.isFinite(callback2Result3) ? Math.round(callback2Result3 * 4) : 7)) %
            1000000007;
        }
      }
      return index28;
    },
    rebuild() {
      state.allocateFields();
      state.bakeAll();
    },
    bedAt: state.bedAt,
    smoothBedAt: (value55, value56) =>
      state.sampleBilinear(
        state.smoothBed,
        value55,
        value56,
        state.getSurfaceY() - waterState.waterFieldDeepDepth,
      ),
    landNearAt: (value57, value58) => {
      let callback4Result2 = state.fieldIndexAt(value57, value58);
      return callback4Result2 < 0 ? 0 : state.landNear[callback4Result2];
    },
    coastAt: (value59, value60) =>
      state.sampleBilinear(
        state.coastDistance,
        value59,
        value60,
        waterState.waterCoastDistanceLimit,
      ),
    openAt: (value61, value62) => state.sampleBilinear(state.openWater, value61, value62, 1),
    flowAt: (
      value63,
      value64,
      position2 = {
        x: 0,
        z: 0,
      },
    ) => {
      position2.x = state.sampleBilinear(state.flowX, value63, value64, 0);
      position2.z = state.sampleBilinear(state.flowZ, value63, value64, 0);
      return position2;
    },
    DEEP: waterState.waterFieldDeepDepth,
  };
}
