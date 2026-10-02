import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { FXAAPass } from "three/addons/postprocessing/FXAAPass.js";
import { renderingState } from "../state.js";
import { createPostRenderTarget } from "./create-post-render-target.js";
import { callbackRenderPassClass } from "./callback-render-pass-class.js";
import { resizePostRenderTargets } from "./resize-post-render-targets.js";
import { createBloomPass, createColorGradePass } from "./create-output-passes.js";

/** Preserve the original pass ordering and render-target ping-pong. */
export function createPostPipeline(context) {
  const state = renderingState.postprocessingState;
  const { aoMat, aoBlurMat, dofDownMat, kawaseMat, compMat, shaftMaskMat, shaftBlurMat } =
    state.mats;
  const draw = (renderer, material, target) => {
    state.fsq.material = material;
    renderer.setRenderTarget(target);
    state.fsq.render(renderer);
  };
  const composer = new EffectComposer(context.renderer, createPostRenderTarget(2, 2));
  composer.renderTarget1.texture.name = "Post.rt1";
  composer.renderTarget2.texture.name = "Post.rt2";
  state.composer = composer;
  const scenePass = new callbackRenderPassClass(
    (renderer) => {
      renderer.setRenderTarget(state.T.scene);
      renderer.render(context.scene, context.camera);
    },
    false,
    (width, height) => resizePostRenderTargets(width, height),
  );
  const aoPass = new callbackRenderPassClass((renderer) => {
    const targets = state.T;
    draw(renderer, aoMat, targets.aoA);
    if (state.params.aoBlur !== false) {
      aoBlurMat.uniforms.tAO.value = targets.aoA.texture;
      aoBlurMat.uniforms.uDir.value.set(1 / targets.aoA.width, 0);
      draw(renderer, aoBlurMat, targets.aoB);
      aoBlurMat.uniforms.tAO.value = targets.aoB.texture;
      aoBlurMat.uniforms.uDir.value.set(0, 1 / targets.aoA.height);
      draw(renderer, aoBlurMat, targets.aoA);
    }
  });
  const blur = (renderer, source, destination, offset) => {
    kawaseMat.uniforms.tSrc.value = source.texture;
    kawaseMat.uniforms.uTexel.value.set(1 / source.width, 1 / source.height);
    kawaseMat.uniforms.uOff.value = offset;
    draw(renderer, kawaseMat, destination);
  };
  const dofPass = new callbackRenderPassClass((renderer) => {
    const targets = state.T;
    dofDownMat.uniforms.uTexel.value.set(1 / targets.scene.width, 1 / targets.scene.height);
    draw(renderer, dofDownMat, targets.half1);
    blur(renderer, targets.half1, targets.half2, 0.5);
    blur(renderer, targets.half2, targets.q1, 1);
    blur(renderer, targets.q1, targets.q2, 1);
    blur(renderer, targets.q2, targets.q1, 2);
  });
  const shaftPass = new callbackRenderPassClass((renderer) => {
    const targets = state.T;
    shaftMaskMat.uniforms.uTexel.value.set(1 / targets.scene.width, 1 / targets.scene.height);
    draw(renderer, shaftMaskMat, targets.s1);
    shaftBlurMat.uniforms.tSrc.value = targets.s1.texture;
    shaftBlurMat.uniforms.uLen.value = 0.55;
    draw(renderer, shaftBlurMat, targets.s2);
    shaftBlurMat.uniforms.tSrc.value = targets.s2.texture;
    shaftBlurMat.uniforms.uLen.value = 0.25;
    draw(renderer, shaftBlurMat, targets.s1);
  });
  const compositePass = new callbackRenderPassClass((renderer, writeBuffer, _readBuffer, pass) => {
    draw(renderer, compMat, pass.renderToScreen ? null : writeBuffer);
  }, true);
  const bloomPass = createBloomPass(state.params, state.U);
  const outputPass = createColorGradePass(state.params);
  const fxaaPass = new FXAAPass();
  const passes = {
    scenePass,
    aoPass,
    dofPass,
    shaftPass,
    compositePass,
    bloomPass,
    outputPass,
    fxaaPass,
  };
  for (const pass of Object.values(passes)) composer.addPass(pass);
  state.passes = passes;
  return composer;
}
