/** Postprocessing pipeline configuration, quality tiers, adaptive quality and render targets. */
import * as THREE from "three";
import { renderingState } from "../state.js";
import { blendColorGradeVector } from "./blend-color-grade-vector.js";
export function updatePostAtmosphere(context, daylight) {
  const post = renderingState.postprocessingState;
  const { params: parameters, mats: materials, passes } = post;
  const { camera } = context;
  const compositeUniforms = materials.compMat.uniforms;
  let hazeColor = blendColorGradeVector(post.tmpV, `haze`, daylight);
  let fogColor = context.scene.fog?.color;
  if (fogColor) {
    compositeUniforms.uHazeColor.value.copy(fogColor);
  } else {
    compositeUniforms.uHazeColor.value.setRGB(hazeColor.x, hazeColor.y, hazeColor.z);
  }
  {
    let hazeRgb = compositeUniforms.uHazeColor.value;
    let luminance = 0.2126 * hazeRgb.r + 0.7152 * hazeRgb.g + 0.0722 * hazeRgb.b;
    let desaturation = 0.35 * daylight.golden;
    hazeRgb.setRGB(
      hazeRgb.r + (luminance - hazeRgb.r) * desaturation,
      hazeRgb.g + (luminance - hazeRgb.g) * desaturation,
      hazeRgb.b + (luminance - hazeRgb.b) * desaturation,
    );
  }
  let goldenWeight = Math.max(
    daylight.golden,
    Number.isFinite(context.sky?.goldenFactor) ? context.sky.goldenFactor : 0,
    THREE.MathUtils.smoothstep(daylight.elev, -0.32, -0.12) *
      (1 - THREE.MathUtils.smoothstep(daylight.elev, 0, 0.2)),
  );
  compositeUniforms.uHazeAmt.value =
    parameters.haze *
    (context.scene.fog ? 0.35 : 1) *
    (1 - post.underFull) *
    (1 - 0.5 * goldenWeight) *
    (1 - 0.4 * daylight.night);
  compositeUniforms.uHazeCool.value = Math.min(1, 0.35 + 0.65 * goldenWeight);
  if (context.sky?.sunDir) {
    compositeUniforms.uSunDirW.value.copy(context.sky.sunDir);
  }
  let hazeStart = Math.max(parameters.hazeStart, post.focusDist * 1.15);
  compositeUniforms.uHazeStart.value = hazeStart;
  compositeUniforms.uHazeEnd.value =
    hazeStart + (parameters.hazeEnd - parameters.hazeStart) * Math.max(1, post.focusDist / 25);
  let sunDirection = context.sky?.sunDir;
  let shaftAmount = 0;
  if (sunDirection && parameters.shafts > 0 && !post.underFull && !parameters.debug) {
    let sunAlignment = camera
      .getWorldDirection((post.tmpV2 ??= new THREE.Vector3()))
      .dot(sunDirection);
    let projectedSun = post.tmpV
      .copy(camera.position)
      .addScaledVector(sunDirection, 1e3)
      .project(camera);
    let screenEdge = Math.max(Math.abs(projectedSun.x), Math.abs(projectedSun.y));
    shaftAmount =
      parameters.shafts *
      THREE.MathUtils.smoothstep(sunAlignment, 0.05, 0.45) *
      (1 - THREE.MathUtils.smoothstep(screenEdge, 1.1, 1.8)) *
      THREE.MathUtils.smoothstep(sunDirection.y, -0.02, 0.08) *
      (0.55 * daylight.day + 0.7 * daylight.golden);
    materials.shaftMaskMat.uniforms.uSunUv.value.set(
      projectedSun.x * 0.5 + 0.5,
      projectedSun.y * 0.5 + 0.5,
    );
  }
  passes.shaftPass.enabled = shaftAmount > 0.002;
  let sunColor = context.sun?.color;
  let shaftColor = compositeUniforms.uShaftColor.value.setRGB(1, 0.9, 0.74);
  if (sunColor) {
    let sunBrightness = Math.max(0.3, sunColor.r, sunColor.g, sunColor.b);
    shaftColor.lerp(
      post.tmpC.setRGB(
        sunColor.r / sunBrightness,
        sunColor.g / sunBrightness,
        sunColor.b / sunBrightness,
      ),
      0.6,
    );
  }
  shaftColor.multiplyScalar(passes.shaftPass.enabled ? shaftAmount * 0.55 : 0);
  let bloomPass = passes.bloomPass;
  let bloomScale = post.tier.bloomScale;
  bloomPass.strength =
    parameters.bloomStrength *
    (1 + 0.35 * daylight.golden + 0.9 * daylight.night) *
    (bloomScale < 0.75 ? 0.65 : bloomScale < 1 ? 0.85 : 1);
  bloomPass.radius = parameters.bloomRadius * (0.5 + 0.5 * bloomScale);
  let bloomThresholdHint = Number.isFinite(context.sky?.bloomThresholdHint)
    ? context.sky.bloomThresholdHint
    : 1;
  bloomPass.threshold =
    parameters.bloomThreshold * (1 - 0.35 * daylight.night) * bloomThresholdHint;
  bloomPass.highPassUniforms.smoothWidth.value = parameters.bloomKnee;
}
