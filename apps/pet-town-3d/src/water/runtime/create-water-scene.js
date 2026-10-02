/** Water lifecycle, terrain rebaking, dynamic reflections/refraction, ripples, splashes, and public water API. */
/** Water lifecycle, terrain rebaking, dynamic reflections/refraction, ripples, splashes, and public water API. */
import * as THREE from "three";
import { createWaterDebugTerrain } from "../debug-terrain/create-water-debug-terrain.js";
import { insetWaterSurfaceAtBlockBoundary } from "./inset-water-surface-at-block-boundary.js";
import { createWaterTerrainFields } from "../terrain-fields/create-water-terrain-fields.js";
import { createWaterMaterial } from "../material/create-water-material.js";
import { createAdaptiveWaterGrid } from "./create-adaptive-water-grid.js";
import { createWaterSplashParticles } from "../splashes/create-water-splash-particles.js";
export function createWaterScene(state) {
  ({ scene: state.scene, camera: state.camera } = state.context);
  state.params = state.context.params ?? new URLSearchParams(location.search);
  state.parsedLevel = parseFloat(state.params.get(`waterDebugLevel`));
  state.levelOverride = Number.isFinite(state.parsedLevel) ? state.parsedLevel : null;
  state.terrainLevel = () =>
    Number.isFinite(state.context.terrain?.waterLevel) ? state.context.terrain.waterLevel : 3;
  if (state.params.has(`waterTest`)) {
    createWaterDebugTerrain(state.context, state.levelOverride ?? 3);
  }
  state.level = state.levelOverride ?? state.terrainLevel();
  state.surfaceY = insetWaterSurfaceAtBlockBoundary(state.level);
  state.time = 0;
  state.heightfield = createWaterTerrainFields(state.context, () => state.surfaceY);
  ({ material: state.material, uniforms: state.uniforms } = createWaterMaterial());
  state.bounds = state.heightfield.bounds;
  state.centerX = (state.bounds.x0 + state.bounds.x1) / 2;
  state.centerZ = (state.bounds.z0 + state.bounds.z1) / 2;
  state.terrainRadius =
    Math.max(state.bounds.x1 - state.bounds.x0, state.bounds.z1 - state.bounds.z0) / 2;
  state.mesh = new THREE.Mesh(
    createAdaptiveWaterGrid(
      state.centerX,
      state.centerZ,
      Math.ceil(state.terrainRadius + 24),
      Math.max(700, state.camera.far * 1.2),
      1,
    ),
    state.material,
  );
  state.mesh.name = `water`;
  state.mesh.position.y = state.surfaceY;
  state.mesh.receiveShadow = true;
  state.mesh.castShadow = false;
  state.mesh.frustumCulled = false;
  state.scene.add(state.mesh);
  state.splashes = createWaterSplashParticles(state.scene);
  state.wetnessUniforms = {
    uWaterTex: {
      value: null,
    },
    uWaterRect: state.uniforms.uHeightRect,
    uWaterSurfaceY: state.uniforms.uSurfaceY,
    uWaterTime: state.uniforms.uTime,
  };
  state.syncHeightUniforms = () => {
    state.uniforms.uHeightTex.value = state.heightfield.texture;
    state.uniforms.uWaterTex.value = state.heightfield.texture2;
    state.wetnessUniforms.uWaterTex.value = state.heightfield.texture2;
    let rect2 = state.heightfield.rect;
    state.uniforms.uHeightRect.value.set(rect2.x, rect2.z, rect2.w, rect2.h);
    state.uniforms.uSurfaceY.value = state.surfaceY;
    state.mesh.position.y = state.surfaceY;
  };
  state.syncHeightUniforms();
}
