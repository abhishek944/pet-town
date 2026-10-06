import { updatePostFocus } from "./update-post-focus.js";
import { updatePostColorGrade } from "./update-post-color-grade.js";
import { updatePostAtmosphere } from "./update-post-atmosphere.js";
/** Postprocessing pipeline configuration, quality tiers, adaptive quality and render targets. */
import { renderingState } from "../state.js";
import { evaluateAdaptiveQuality } from "./evaluate-adaptive-quality.js";
import { sampleFxDaylightWeights } from "../../effects/daylight/sample-fx-daylight-weights.js";
export function updatePostprocessing(deltaSeconds, context) {
  const post = renderingState.postprocessingState;
  if (!post) {
    return;
  }
  let deltaTime = Number.isFinite(deltaSeconds) ? Math.min(Math.max(deltaSeconds, 0), 0.1) : 0;
  post.time = (post.time ?? 0) + deltaTime;
  let { camera } = context;
  let { params: parameters, mats: materials, passes } = post;
  if (post.debugCam) {
    camera.position.copy(post.debugCam.pos);
    camera.lookAt(post.debugCam.target);
    camera.updateMatrixWorld();
  }
  let now = performance.now();
  let frameTime = post.lastNow ? Math.min((now - post.lastNow) / 1e3, 1) : 1 / 60;
  post.lastNow = now;
  if (frameTime < 0.25) {
    post.frameEMA += (frameTime - post.frameEMA) * 0.05;
  }
  context.post.stats.frameMs = post.frameEMA * 1e3;
  post.warm += frameTime;
  if (!post.locked && !post.debugCam && !document.hidden) {
    evaluateAdaptiveQuality(now, frameTime);
  }
  let toneMapping = parameters.debug
    ? 0
    : (renderingState.toneMappingModes[parameters.toneMapping] ?? 7);
  if (context.renderer.toneMapping !== toneMapping) {
    context.renderer.toneMapping = toneMapping;
  }
  updatePostFocus(deltaTime, context);
  let waterLevel = context.water?.surfaceY ?? context.water?.level ?? context.terrain?.waterLevel;
  let cameraPosition = camera.position;
  let overWater =
    !context.terrain?.isWater || context.terrain.isWater(cameraPosition.x, cameraPosition.z);
  let nearWaterSurface =
    typeof waterLevel == `number` && overWater && cameraPosition.y < waterLevel + 0.2 ? 1 : 0;
  post.under = nearWaterSurface;
  post.waterY = waterLevel ?? -1e9;
  post.underFull = nearWaterSurface && cameraPosition.y < waterLevel - 0.25 ? 1 : 0;
  let aoEnabled = parameters.ao && post.tier.ao;
  passes.aoPass.enabled = aoEnabled;
  let daylight = sampleFxDaylightWeights(context);
  let mistAmount =
    parameters.mist *
    (0.22 * daylight.day + 0.18 * daylight.golden + 0.1 * daylight.night) *
    (1 - post.underFull);
  passes.dofPass.enabled = (parameters.dof && !post.underFull) || mistAmount > 0;
  passes.bloomPass.enabled = parameters.bloom;
  let compositeUniforms = materials.compMat.uniforms;
  compositeUniforms.uMist.value = parameters.debug ? 0 : mistAmount;
  compositeUniforms.uMistCap.value = parameters.mistCap;
  compositeUniforms.uUseAO.value = +!!aoEnabled;
  compositeUniforms.uUseDOF.value = +!!parameters.dof * (1 - post.underFull);
  materials.dofDownMat.uniforms.uUseAO.value = +!!aoEnabled;
  compositeUniforms.uSharpen.value = parameters.sharpenEff;
  compositeUniforms.uTime.value = post.time;
  compositeUniforms.uUnder.value = post.under;
  compositeUniforms.uWaterY.value = post.waterY;
  compositeUniforms.uWaterLight.value = 1 - 0.945 * daylight.night;
  compositeUniforms.uProjInv.value.copy(camera.projectionMatrixInverse);
  compositeUniforms.uCamWorld.value.copy(camera.matrixWorld);
  compositeUniforms.uDebug.value = parameters.debug;
  if (parameters.debug) {
    passes.bloomPass.enabled = false;
  }
  updatePostColorGrade(daylight);
  updatePostAtmosphere(context, daylight);
}
