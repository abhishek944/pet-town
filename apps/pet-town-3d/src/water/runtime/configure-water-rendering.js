/** Water lifecycle, terrain rebaking, dynamic reflections/refraction, ripples, splashes, and public water API. */
/** Water lifecycle, terrain rebaking, dynamic reflections/refraction, ripples, splashes, and public water API. */
import * as THREE from "three";
export function configureWaterRendering(state) {
  state.reflectionScale = 0.42;
  state.refractionScale = 1;
  state.qualityHooked = false;
  state.applyQualityTier = (reflectionValue) => {
    let reflection2 = reflectionValue?.reflection;
    state.reflectionScale = Number.isFinite(reflection2)
      ? reflection2
      : reflectionValue?.name === `low`
        ? 0
        : reflectionValue?.name === `med`
          ? 0.3
          : 0.42;
    let refraction2 = reflectionValue?.refraction;
    state.refractionScale =
      Number.isFinite(refraction2) && refraction2 > 0 ? Math.min(1, refraction2) : 1;
    if (state.reflectionScale <= 0 && state.reflectionParameter !== `1`) {
      state.reflection.rt.setSize(2, 2);
    }
  };
  state.hookQualityTier = () => {
    if (!state.qualityHooked && state.context.post) {
      state.qualityHooked = true;
      if (typeof state.context.post.onTier == `function`) {
        state.context.post.onTier(state.applyQualityTier);
      } else {
        state.applyQualityTier(state.context.post.tier);
      }
    }
  };
  state.cameraDirection = new THREE.Vector3();
  state.rendererSize = new THREE.Vector2();
  state.mesh.onBeforeRender = (canvas, value4, getWorldDirectionValue) => {
    if (
      (state.hookQualityTier(),
      (state.uniforms.uAlphaOut.value = canvas.getRenderTarget() ? 0.5 : 1),
      getWorldDirectionValue !== state.context.camera)
    ) {
      return;
    }
    if (state.refractionMode === `grab`) {
      let renderTargetResult = canvas.getRenderTarget();
      let result30 = canvas.getSize(state.rendererSize).x || 1;
      let result31 =
        (renderTargetResult ? renderTargetResult.width : canvas.getContext().drawingBufferWidth) /
        result30;
      let grabResult = state.sceneGrabber.grab(
        Math.min(result31 >= 1.5 ? 0.5 : 1, state.refractionScale),
      );
      if (grabResult) {
        state.uniforms.uSceneTex.value = grabResult.texture;
        state.uniforms.uSceneDisplay.value = +!!grabResult.display;
        let toneMapping2 = canvas.toneMapping;
        state.uniforms.uSceneTM.value = toneMapping2 === 4 ? 2 : +(toneMapping2 === 1);
        state.uniforms.uSceneExposure.value = canvas.toneMappingExposure || 1;
      } else {
        state.grabFailed = true;
      }
    }
    let result28 =
      state.reflectionParameter === `1` ||
      (state.reflectionParameter !== `0` && state.reflectionScale > 0);
    let enabled4 = false;
    let y2 = getWorldDirectionValue.getWorldDirection(state.cameraDirection).y;
    let result29 = getWorldDirectionValue.position.y - state.surfaceY;
    if (
      result28 &&
      !(
        state.reflectionParameter !== `1` &&
        (state.reflectAll
          ? y2 < -0.88
          : y2 < -0.88 || (result29 > 25 && y2 < -0.4) || result29 > 70)
      )
    ) {
      if (state.time - state.reflectionListUpdatedAt > 3 || state.reflectionListUpdatedAt < 0) {
        state.reflectionListUpdatedAt = state.time;
        state.collectReflectionHiddenObjects(value4);
      }
      enabled4 = state.reflection.render(
        canvas,
        value4,
        getWorldDirectionValue,
        state.surfaceY,
        state.reflectionScale > 0 ? state.reflectionScale : 0.3,
        state.reflectionHiddenObjects,
        120,
      );
      if (enabled4) {
        state.uniforms.uReflMatrix.value.copy(state.reflection.texMatrix);
      }
    }
    state.uniforms.uReflOn.value = +!!enabled4;
  };
}
