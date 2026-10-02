/** Cached effect textures, instanced billboards, decals, smoke, campfire particles and pooled lights. */
import { propsState } from "../state.js";
import { createFlameParticleTexture } from "../texture-maps/create-flame-particle-texture.js";
export let getFlameParticleTexture = () =>
  (propsState.flameParticleTextureCache ??= createFlameParticleTexture());
