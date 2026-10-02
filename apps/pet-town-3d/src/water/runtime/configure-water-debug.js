/** Water lifecycle, terrain rebaking, dynamic reflections/refraction, ripples, splashes, and public water API. */
/** Water lifecycle, terrain rebaking, dynamic reflections/refraction, ripples, splashes, and public water API. */

export function configureWaterDebug(state) {
  state.debugCameraParameter = state.params.get(`waterDebugCam`);
  state.debugCameraPose = null;
  if (state.debugCameraParameter) {
    let values4 = state.debugCameraParameter.split(`,`).map(Number);
    if (values4.length >= 6 && values4.every(Number.isFinite)) {
      state.debugCameraPose = values4;
    }
  }
  state.applyDebugCamera = () => {
    if (state.debugCameraPose) {
      state.camera.position.set(
        state.debugCameraPose[0],
        state.debugCameraPose[1],
        state.debugCameraPose[2],
      );
      state.camera.lookAt(
        state.debugCameraPose[3],
        state.debugCameraPose[4],
        state.debugCameraPose[5],
      );
      state.camera.updateMatrixWorld();
    }
  };
  if (state.debugCameraPose) {
    let onBeforeRender2 = state.scene.onBeforeRender;
    state.scene.onBeforeRender = function (...value19) {
      state.applyDebugCamera();
      return onBeforeRender2?.apply(this, value19);
    };
    state.applyDebugCamera();
  }
  state.debugViewModes = {
    depth: 1,
    shore: 2,
    normal: 3,
    caustics: 4,
    shadow: 5,
    foam: 6,
    light: 7,
    open: 8,
    flow: 9,
  };
  state.uniforms.uTune2.value.w = state.debugViewModes[state.params.get(`waterDebug`)] ?? 0;
  state.debugRipples = state.params.has(`waterDebugRipples`);
}
