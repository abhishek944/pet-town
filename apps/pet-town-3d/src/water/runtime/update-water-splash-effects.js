/** Water lifecycle, terrain rebaking, dynamic reflections/refraction, ripples, splashes, and public water API. */
import * as THREE from "three";
import { waterState } from "../state.js";
export function updateWaterSplashEffects(frame) {
  frame.renderer = frame.context.renderer;
  if (
    waterState.waterRuntimeState.tScale === undefined
      ? frame.renderer.transmissionResolutionScale === 1
      : frame.renderer.transmissionResolutionScale === waterState.waterRuntimeState.tScale
  ) {
    let result6 = Math.max(frame.renderer.getPixelRatio(), frame.context.post?.tier?.pr ?? 0, 1);
    waterState.waterRuntimeState.tScale = Math.min(1, Math.max(0.5, 1 / result6));
    frame.renderer.transmissionResolutionScale = waterState.waterRuntimeState.tScale;
  }
  frame.far = frame.context.camera.far;
  frame.uniforms.uFade.value.set(frame.far * 0.42, frame.far * 0.88);
  for (let result7 = waterState.waterRuntimeState.pending.length - 1; result7 >= 0; result7--) {
    let position2 = waterState.waterRuntimeState.pending[result7];
    if (frame.time >= position2.at) {
      waterState.waterRuntimeState.ripple(position2.x, position2.z, position2.s);
      waterState.waterRuntimeState.pending.splice(result7, 1);
    }
  }
  frame.context.renderer.getDrawingBufferSize(waterState.waterRuntimeState.tmpSize);
  frame.camera = frame.context.camera;
  if (frame.camera.isPerspectiveCamera) {
    waterState.waterRuntimeState.splashes.setScale(
      waterState.waterRuntimeState.tmpSize.y /
        (2 * Math.tan(THREE.MathUtils.degToRad(frame.camera.fov) / 2)),
    );
  }
  frame.splashLight =
    0.2126 * frame.horizonColor.r + 0.7152 * frame.horizonColor.g + 0.0722 * frame.horizonColor.b;
  waterState.waterRuntimeState.splashes.update(
    frame.deltaTime,
    waterState.waterRuntimeState.sample,
    (value8, value9) => waterState.waterRuntimeState.ripple(value8, value9, 0.25),
    Math.min(1, Math.max(0.15, frame.splashLight * 1.4)),
  );
}
