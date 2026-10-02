/** Water lifecycle, terrain rebaking, dynamic reflections/refraction, ripples, splashes, and public water API. */
/** Water lifecycle, terrain rebaking, dynamic reflections/refraction, ripples, splashes, and public water API. */

import { waterState } from "../state.js";
export function exposeWaterApi(state) {
  state.ripples = state.uniforms.uRipples.value;
  state.pendingRipples = [];
  state.isWater = (value14, value15) => state.heightfield.bedAt(value14, value15) <= state.surfaceY;
  state.depthAt = (value16, value17) =>
    state.isWater(value16, value17)
      ? Math.max(0, state.sample(value16, value17) - state.heightfield.bedAt(value16, value17))
      : 0;
  state.isUnderwater = (position4) =>
    !!position4 &&
    state.isWater(position4.x, position4.z) &&
    position4.y < state.sample(position4.x, position4.z);
  state.api = {
    level: state.level,
    surfaceY: state.surfaceY,
    mesh: state.mesh,
    material: state.material,
    uniforms: state.uniforms,
    NO_REFLECT_LAYER: 7,
    wetness: {
      glsl: waterState.waterWetnessShader,
      uniforms: state.wetnessUniforms,
    },
    sample: state.sample,
    depthAt: state.depthAt,
    isWater: state.isWater,
    isUnderwater: state.isUnderwater,
    ripple: state.ripple,
    splash: state.splash,
    setLevel: state.setLevel,
    rebake() {
      state.heightfield.rebuild();
      state.syncHeightUniforms();
    },
    get heightfield() {
      return state.heightfield;
    },
  };
  state.context.water = state.api;
}
