/** Postprocessing pipeline configuration, quality tiers, adaptive quality and render targets. */
import * as THREE from "three";
import { renderingState } from "../state.js";
import { currentMultisampleCount } from "./current-multisample-count.js";
import { createPostRenderTarget } from "./create-post-render-target.js";
export function resizePostRenderTargets(width, height) {
  let T2 = renderingState.postprocessingState.T;
  let currentMultisampleCountResult = currentMultisampleCount();
  let result = renderingState.postprocessingState.tier.aoScale ?? 0.5;
  if (
    T2.scene &&
    T2.scene.width === width &&
    T2.scene.height === height &&
    T2.scene.samples === currentMultisampleCountResult &&
    T2.aoScale === result
  ) {
    return;
  }
  for (let result4 in T2) {
    T2[result4]?.dispose?.();
  }
  T2.scene?.depthTexture?.dispose();
  let depthTexture2 = new THREE.DepthTexture(width, height, THREE.FloatType);
  T2.scene = new THREE.WebGLRenderTarget(width, height, {
    type: THREE.HalfFloatType,
    samples: currentMultisampleCountResult,
    depthBuffer: true,
    depthTexture: depthTexture2,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
  });
  T2.scene.texture.name = `Post.scene`;
  let ceilResult = Math.ceil(width / 2);
  let ceilResult2 = Math.ceil(height / 2);
  let ceilResult3 = Math.ceil(width / 4);
  let ceilResult4 = Math.ceil(height / 4);
  let result2 = Math.max(1, Math.ceil(width * result));
  let result3 = Math.max(1, Math.ceil(height * result));
  T2.aoA = createPostRenderTarget(result2, result3);
  T2.aoB = createPostRenderTarget(result2, result3);
  T2.aoScale = result;
  T2.half1 = createPostRenderTarget(ceilResult, ceilResult2);
  T2.half2 = createPostRenderTarget(ceilResult, ceilResult2);
  T2.q1 = createPostRenderTarget(ceilResult3, ceilResult4);
  T2.q2 = createPostRenderTarget(ceilResult3, ceilResult4);
  T2.s1 = createPostRenderTarget(ceilResult3, ceilResult4);
  T2.s2 = createPostRenderTarget(ceilResult3, ceilResult4);
  let {
    aoMat: mats2,
    dofDownMat: mats3,
    compMat: mats4,
    shaftMaskMat: mats5,
  } = renderingState.postprocessingState.mats;
  mats5.uniforms.tScene.value = T2.scene.texture;
  mats4.uniforms.tShafts.value = T2.s1.texture;
  mats5.uniforms.uAspect.value = width / height;
  renderingState.postprocessingState.U.tDepth.value = depthTexture2;
  mats2.uniforms.uFullRes.value.set(width, height);
  mats3.uniforms.tScene.value = T2.scene.texture;
  mats3.uniforms.tAO.value = T2.aoA.texture;
  mats4.uniforms.tScene.value = T2.scene.texture;
  mats4.uniforms.tAO.value = T2.aoA.texture;
  mats4.uniforms.tBlur1.value = T2.half2.texture;
  mats4.uniforms.tBlur2.value = T2.q1.texture;
  mats4.uniforms.uRes.value.set(width, height);
  mats4.uniforms.uAORes.value.set(result2, result3);
}
