import * as THREE from "three";
import { gameExtensions } from "#town-extensions";
import { gameConfig } from "./core/config.js";
import { prepareGameData } from "./core/prepare-game-data.js";
import { createGameSystems } from "./core/systems.js";
import { createExtensionRegistry } from "./core/extensions.js";
import { createGameViewport } from "./core/viewport.js";
import { isGameInputCaptured } from "./core/input-capture.js";
import { renderPostprocessing } from "./rendering/postprocessing/render-postprocessing.js";
import { initializeCameraQueries } from "./player/camera-query/create-camera-queries.js";
prepareGameData();
const canvas = document.getElementById("game");
const params = new URLSearchParams(location.search);
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: params.get("post") === "off",
  powerPreference: "high-performance",
});
renderer.setPixelRatio(Math.min(devicePixelRatio, gameConfig.renderer.pixelRatioLimit));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  gameConfig.renderer.cameraFov,
  innerWidth / innerHeight,
  gameConfig.renderer.near,
  gameConfig.renderer.far,
);
camera.position.fromArray(gameConfig.renderer.initialCameraPosition);
export const context = {
  THREE,
  renderer,
  scene,
  camera,
  canvas,
  params,
  gameTitle: gameConfig.title,
  time: 0,
  dt: 0,
  keys: {},
  ready: false,
};
// Retained for the original development controls and exposed extension APIs.
window.__ctx = context;
window.petTownGame = context;
createGameViewport(context);
await initializeCameraQueries(context);
const systems = createGameSystems();
for (const system of systems) system.init?.(context);
context.extensions = createExtensionRegistry(context);
for (const extension of gameExtensions) context.extensions.add(extension);

addEventListener("keydown", (event) => {
  if (!isGameInputCaptured(context, event)) context.keys[event.code] = true;
});
addEventListener("keyup", (event) => {
  context.keys[event.code] = false;
});

let previousFrameTime = performance.now();
function frame(now) {
  const deltaTime = Math.max(
    0,
    Math.min((now - previousFrameTime) / 1000, gameConfig.renderer.maxFrameDelta),
  );
  previousFrameTime = now;
  context.dt = deltaTime;
  context.time += deltaTime;
  for (const system of systems) {
    if (system.id === "player") context.extensions.beforePlayerUpdate(deltaTime);
    system.update?.(deltaTime, context);
    if (system.id === "player") {
      context.extensions.afterPlayerUpdate(deltaTime);
      camera.updateMatrixWorld();
    }
  }
  context.extensions.update(deltaTime);
  renderPostprocessing(context);
  context.hasRenderedFrame = true;
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
context.ready = true;
dispatchEvent(new CustomEvent("pet-town:ready", { detail: context }));
