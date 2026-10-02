/** Cached effect textures, instanced billboards, decals, smoke, campfire particles and pooled lights. */
import { propsState } from "../state.js";
import { createSmokeParticleTexture } from "../texture-maps/create-smoke-particle-texture.js";
export let getSmokeParticleTexture = () =>
  (propsState.smokeParticleTextureCache ??= createSmokeParticleTexture());
