/** Cached effect textures, instanced billboards, decals, smoke, campfire particles and pooled lights. */
import { PropBillboardBatch } from "./prop-billboard-batch.js";
import { getSmokeParticleTexture } from "./get-smoke-particle-texture.js";
import { getFlameParticleTexture } from "./get-flame-particle-texture.js";
import { getGlowParticleTexture } from "./get-glow-particle-texture.js";
import { PropDecalBatch } from "./prop-decal-batch.js";
export function createPropEffectBatches(value) {
  return {
    smoke: new PropBillboardBatch(value, getSmokeParticleTexture(), 96, {
      name: `props_smoke`,
      renderOrder: 2,
    }),
    flame: new PropBillboardBatch(value, getFlameParticleTexture(), 32, {
      name: `props_flames`,
      center: [0.5, 0.06],
      fog: false,
      renderOrder: 3,
      cutout: 0.45,
    }),
    glow: new PropBillboardBatch(value, getGlowParticleTexture(), 160, {
      name: `props_glow`,
      additive: true,
      fog: false,
      renderOrder: 1,
    }),
    pools: new PropDecalBatch(value, getGlowParticleTexture(), 128, {
      name: `props_lightpools`,
      additive: true,
    }),
    shade: new PropDecalBatch(value, getGlowParticleTexture(), 256, {
      name: `props_shade`,
      additive: false,
      renderOrder: 0,
    }),
  };
}
