import * as THREE from "three";
import { renderingState } from "../state.js";
import { createPostShaderMaterial } from "./create-post-shader-material.js";

/** Shared uniform objects keep every depth-dependent pass synchronized. */
export function createPostMaterials(camera, parameters, tier, debugView) {
  const depth = {
    tDepth: { value: null },
    cameraNear: { value: camera.near },
    cameraFar: { value: camera.far },
    uFocusY: { value: 0.5 },
    uBand: { value: parameters.band },
    uRamp: { value: parameters.ramp },
    uTopAmt: { value: parameters.tiltTop },
    uBottomAmt: { value: parameters.tiltBottom },
    uFocusDist: { value: 22 },
    uFarAmt: { value: parameters.farAmt },
    uNearAmt: { value: parameters.nearAmt },
    uAOTint: { value: parameters.aoTint },
    uAOStrength: { value: parameters.aoStrength },
  };
  renderingState.postprocessingState.U = depth;
  const aoMat = createPostShaderMaterial(
    renderingState.ambientOcclusionFragmentShader,
    {
      tDepth: depth.tDepth,
      uFullRes: { value: new THREE.Vector2() },
      uProjInv: { value: new THREE.Matrix4() },
      uProj11: { value: 1 },
      uRadius: { value: parameters.aoRadius },
      uIntensity: { value: parameters.aoIntensity },
      uMaxPx: { value: 90 },
      uBias: { value: 0.08 },
      uPower: { value: parameters.aoPower },
    },
    { AO_SAMPLES: tier.aoSamples || 8, ...(debugView === "normal" ? { AO_DEBUG_NORMAL: 1 } : {}) },
  );
  const aoBlurMat = createPostShaderMaterial(renderingState.ambientOcclusionBlurFragmentShader, {
    tAO: { value: null },
    uDir: { value: new THREE.Vector2() },
  });
  const dofDownMat = createPostShaderMaterial(renderingState.depthOfFieldDownsampleFragmentShader, {
    ...depth,
    tScene: { value: null },
    tAO: { value: null },
    uTexel: { value: new THREE.Vector2() },
    uUseAO: { value: 0 },
  });
  const kawaseMat = createPostShaderMaterial(renderingState.kawaseBlurFragmentShader, {
    tSrc: { value: null },
    uTexel: { value: new THREE.Vector2() },
    uOff: { value: 0 },
  });
  const compMat = createPostShaderMaterial(renderingState.postCompositeFragmentShader, {
    ...depth,
    tScene: { value: null },
    tAO: { value: null },
    tBlur1: { value: null },
    tBlur2: { value: null },
    uRes: { value: new THREE.Vector2() },
    uAORes: { value: new THREE.Vector2() },
    uUseAO: { value: 0 },
    uUseDOF: { value: 1 },
    uSharpen: { value: 0 },
    uTime: { value: 0 },
    uHazeColor: { value: new THREE.Color() },
    uSunDirW: { value: new THREE.Vector3(0, 1, 0) },
    uHazeCool: { value: 0 },
    uHazeAmt: { value: 0 },
    uHazeStart: { value: parameters.hazeStart },
    uHazeEnd: { value: parameters.hazeEnd },
    uUnder: { value: 0 },
    uWaterY: { value: 0 },
    uWaterColor: { value: parameters.underwaterColor },
    uWaterDeep: { value: parameters.underwaterDeep },
    uProjInv: { value: new THREE.Matrix4() },
    uCamWorld: { value: new THREE.Matrix4() },
    tShafts: { value: null },
    uShaftColor: { value: new THREE.Color(0, 0, 0) },
    uMist: { value: 0 },
    uMistCap: { value: 0.6 },
    uDebug: { value: parameters.debug },
  });
  const shaftMaskMat = createPostShaderMaterial(renderingState.sunShaftMaskFragmentShader, {
    tScene: { value: null },
    tDepth: depth.tDepth,
    uSunUv: { value: new THREE.Vector2() },
    uTexel: { value: new THREE.Vector2() },
    uAspect: { value: 1 },
  });
  const shaftBlurMat = createPostShaderMaterial(renderingState.sunShaftBlurFragmentShader, {
    tSrc: { value: null },
    uSunUv: shaftMaskMat.uniforms.uSunUv,
    uLen: { value: 1 },
  });
  return { aoMat, aoBlurMat, dofDownMat, kawaseMat, compMat, shaftMaskMat, shaftBlurMat };
}
