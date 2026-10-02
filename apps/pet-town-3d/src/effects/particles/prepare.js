import { createAmbientParticlePresets } from "./ambient-presets.js";
import { createWaterParticlePresets } from "./water-presets.js";
import { createFoliageParticlePresets } from "./foliage-presets.js";
import { createCelebrationParticlePresets } from "./celebration-presets.js";
import { createConstructionParticlePresets } from "./construction-presets.js";
/** Instanced particle presets, bursts, foliage drift, fireflies, pollen and motes. */
import sourceAsset64 from "./assets/prepare-effects-particles-64.glsl?raw";
import sourceAsset65 from "./assets/prepare-effects-particles-65.glsl?raw";
import sourceAsset66 from "./assets/prepare-effects-particles-66.glsl?raw";
import * as THREE from "three";
import { effectsState } from "../state.js";
import { emitParticleBurst } from "./emit-particle-burst.js";
import { initializeParticleEffects } from "./initialize-particle-effects.js";
import { updateParticleEffects } from "./update-particle-effects.js";
export function prepareEffectsParticles() {
  const constructionParticlePresets = createConstructionParticlePresets();
  const celebrationParticlePresets = createCelebrationParticlePresets();
  const foliageParticlePresets = createFoliageParticlePresets();
  const waterParticlePresets = createWaterParticlePresets();
  const ambientParticlePresets = createAmbientParticlePresets();
  effectsState.particleEffectsModule = {
    get burst() {
      return emitParticleBurst;
    },
    get init() {
      return initializeParticleEffects;
    },
    get update() {
      return updateParticleEffects;
    },
  };
  effectsState.particlePoolCapacity = 4096;
  effectsState.particleColorScratch = new THREE.Color();
  effectsState.particlePresets = {
    dust: constructionParticlePresets.dust,
    hearts: celebrationParticlePresets.hearts,
    sparkle: celebrationParticlePresets.sparkle,
    stars: celebrationParticlePresets.stars,
    leaves: foliageParticlePresets.leaves,
    splash: waterParticlePresets.splash,
    bubbles: waterParticlePresets.bubbles,
    notes: celebrationParticlePresets.notes,
    smoke: constructionParticlePresets.smoke,
    zzz: celebrationParticlePresets.zzz,
    ripple: waterParticlePresets.ripple,
    debris: constructionParticlePresets.debris,
    confetti: celebrationParticlePresets.confetti,
    poof: constructionParticlePresets.poof,
    firefly: ambientParticlePresets.firefly,
    pollen: ambientParticlePresets.pollen,
    petal: foliageParticlePresets.petal,
    leaf: foliageParticlePresets.leaf,
  };
  effectsState.particlePresets.autumnLeaf = {
    ...effectsState.particlePresets.leaf,
    colors: [
      [0.95, 0.45, 0.12],
      [0.98, 0.62, 0.15],
      [0.85, 0.3, 0.12],
    ],
  };
  effectsState.particleVertexShader = sourceAsset64;
  effectsState.particleFragmentShader = sourceAsset65;
  effectsState.moteVertexShader = sourceAsset66;
  effectsState.moteFragmentShader = `
uniform vec3 uColor;
varying vec2 vUv;
varying float vA;
void main() {
  float r = length(vUv - 0.5) * 2.0;
  float a = exp(-r * r * 4.0) * (1.0 - smoothstep(0.8, 1.0, r)) * vA;
  if (a < 0.003) discard;
  gl_FragColor = vec4(uColor * a, 0.0);
}`;
  effectsState.particleEffectsState = null;
  effectsState.unknownParticleKinds = new Set();
  effectsState.cachedParticleTrees = null;
  effectsState.cachedParticleTreeCount = -1;
}
