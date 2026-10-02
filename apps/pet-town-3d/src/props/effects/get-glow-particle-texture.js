/** Cached effect textures, instanced billboards, decals, smoke, campfire particles and pooled lights. */
import { propsState } from "../state.js";
import { createGlowParticleTexture } from "../texture-maps/create-glow-particle-texture.js";
export let getGlowParticleTexture = () =>
  (propsState.glowParticleTextureCache ??= createGlowParticleTexture());
