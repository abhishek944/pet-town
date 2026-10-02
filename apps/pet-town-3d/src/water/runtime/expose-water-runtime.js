/** Water lifecycle, terrain rebaking, dynamic reflections/refraction, ripples, splashes, and public water API. */
/** Water lifecycle, terrain rebaking, dynamic reflections/refraction, ripples, splashes, and public water API. */
import * as THREE from "three";
import { waterState } from "../state.js";
export function exposeWaterRuntime(state) {
  waterState.waterRuntimeState = {
    ctx: state.context,
    hf: state.heightfield,
    mesh: state.mesh,
    uniforms: state.uniforms,
    splashes: state.splashes,
    pending: state.pendingRipples,
    api: state.api,
    get time() {
      return state.time;
    },
    set time(value20) {
      state.time = value20;
    },
    get surfaceY() {
      return state.surfaceY;
    },
    markDirty: state.markDirty,
    isDirty: () => state.terrainDirty,
    clearDirty: () => {
      state.terrainDirty = false;
    },
    takeDirtyRect: () => {
      let result17Value = state.dirtyRect;
      state.dirtyRect = null;
      return result17Value;
    },
    setRefractMode: state.setRefractionMode,
    get refractMode() {
      return state.refractionMode;
    },
    refractParam: state.refractionParameter,
    get grabFailed() {
      return state.grabFailed;
    },
    set grabFailed(value21) {
      state.grabFailed = value21;
    },
    dayDeep: state.uniforms.uDeep.value.clone(),
    dayMid: state.uniforms.uMid.value.clone(),
    nightDeep: new THREE.Color(1458002),
    nightMid: new THREE.Color(1924198),
    syncHeightUniforms: state.syncHeightUniforms,
    setLevel: state.setLevel,
    levelOverride: state.levelOverride,
    terrainLevel: state.terrainLevel,
    terrainRef: state.context.terrain,
    rebakeTimes: state.rebakeTimes,
    bakedSum: state.bakedChecksum,
    applyDebugCam: state.applyDebugCamera,
    debugRipples: state.debugRipples,
    debugRippleT: 0,
    ripple: state.ripple,
    splash: state.splash,
    sample: state.sample,
    isWater: state.isWater,
    tracked: new WeakMap(),
    tmpA: new THREE.Vector3(),
    tmpB: new THREE.Vector3(),
    tmpC: new THREE.Color(),
    tmpSize: new THREE.Vector2(),
  };
}
