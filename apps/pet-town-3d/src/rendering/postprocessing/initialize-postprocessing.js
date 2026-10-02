/** Build the depth, lighting, grading and adaptive-quality pipeline. */
import * as THREE from "three";
import { FullScreenQuad } from "three/addons/postprocessing/Pass.js";
import { renderingState } from "../state.js";
import { createPostParameters } from "./post-parameters.js";
import { createPostMaterials } from "./create-post-materials.js";
import { createPostPipeline } from "./create-post-pipeline.js";
import { createPostApi } from "./create-post-api.js";
import { applyRenderingQualityTier } from "./apply-rendering-quality-tier.js";
import { createPostprocessingShowcase } from "../post-showcase/create-postprocessing-showcase.js";

export function initializePostprocessing(context) {
  const { renderer, camera } = context;
  const query = context.params ?? new URLSearchParams(location.search);
  const requestedTier = query.get("q");
  const tier =
    renderingState.renderingQualityTiers[requestedTier] ??
    ((window.devicePixelRatio || 1) >= 2 && !query.has("cam")
      ? renderingState.renderingQualityTiers.med
      : renderingState.renderingQualityTiers.high);
  const parameters = createPostParameters(query);
  renderer.toneMapping = renderingState.toneMappingModes[parameters.toneMapping] ?? 7;
  if (parameters.debug) renderer.toneMapping = 0;
  if (query.has("exposure")) renderer.toneMappingExposure = parameters.exposure;
  const state = (renderingState.postprocessingState = {
    ctx: context,
    params: parameters,
    tier,
    locked: !!renderingState.renderingQualityTiers[requestedTier] || query.has("cam"),
    fsq: new FullScreenQuad(null),
    focusY: 0.5,
    focusDist: 22,
    under: 0,
    frameEMA: 1 / 60,
    slowTime: 0,
    fastTime: 0,
    warm: 0,
    upHold: 8,
    maxTier: "high",
    tierListeners: new Set(),
    downInfo: {},
    arrival: {},
    trial: null,
    size: { w: 0, h: 0 },
    T: {},
    debugCam: null,
    tmpV: new THREE.Vector3(),
    tmpC: new THREE.Color(),
  });
  if (query.has("postDebugCam") && query.get("cam")) {
    const coordinates = query.get("cam").split(",").map(Number);
    if (coordinates.length >= 6 && coordinates.every(Number.isFinite)) {
      state.debugCam = {
        pos: new THREE.Vector3(coordinates[0], coordinates[1], coordinates[2]),
        target: new THREE.Vector3(coordinates[3], coordinates[4], coordinates[5]),
      };
    }
  }
  state.mats = createPostMaterials(camera, parameters, tier, query.get("post"));
  const composer = createPostPipeline(context);
  applyRenderingQualityTier(tier);
  state.ready = true;
  document.addEventListener?.("visibilitychange", () => {
    state.warm = 0;
    state.slowTime = 0;
    state.fastTime = 0;
    state.lastNow = 0;
  });
  if (query.has("postTest")) createPostprocessingShowcase(context);
  context.post = createPostApi(parameters, composer);
}
