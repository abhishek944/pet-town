/** Cell registration and construction of the procedural vegetation asset and field libraries. */

import { createVegetationMaterial } from "../materials/create-vegetation-material.js";
export function createVegetationStemMaterials(assets) {
  assets.materials.pine = createVegetationMaterial(assets.uniforms, {
    map: assets.pineTexture,
    bump: true,
    toon: true,
    bumpAmt: 0.06,
    bumpFreq: 2.6,
    swayAmp: 0.03,
    swayFreq: 0.9,
    rustle: 0.008,
    rim: 0.22,
    trans: 0.2,
    soft: 0.05,
    castShadow: true,
    toonWarm: [1.06, 1.04, 0.94],
    toonCool: [0.84, 0.9, 1],
  });
  assets.materials.frond = createVegetationMaterial(assets.uniforms, {
    side: 2,
    swayAmp: 0.05,
    swayFreq: 1.3,
    rustle: 0.02,
    rim: 0.2,
    trans: 0.45,
    castShadow: true,
  });
  assets.materials.trunk = createVegetationMaterial(assets.uniforms, {
    map: assets.barkTexture,
    swayAmp: 0.035,
    swayFreq: 1.1,
    castShadow: true,
  });
  assets.materials.bush = createVegetationMaterial(assets.uniforms, {
    ...assets.foliageStyle,
    triScale: 0.6,
    bumpAmt: 0.16,
    bumpFreq: 2.2,
    swayAmp: 0.04,
    swayFreq: 1.4,
    rustle: 0.012,
    rim: 0.26,
    trans: 0.3,
    push: 0.12,
  });
  assets.materials.fringeBush = createVegetationMaterial(assets.uniforms, {
    ...assets.fringeStyle,
    trans: 0.45,
    swayAmp: 0.04,
    swayFreq: 1.4,
    rustle: 0.02,
    push: 0.12,
    fadeStart: 32,
    fadeEnd: 45,
  });
  assets.materials.under = createVegetationMaterial(assets.uniforms, {
    side: 2,
    swayAmp: 0.12,
    swayFreq: 1.3,
    push: 0.6,
    fadeStart: 35,
    fadeEnd: 45,
    rim: 0.15,
    trans: 0.45,
    tipGlow: 0.5,
    soft: 0.08,
    normalUp: 0.3,
  });
  assets.materials.sapling = createVegetationMaterial(assets.uniforms, {
    ...assets.foliageStyle,
    castShadow: false,
    triScale: 0.8,
    bumpAmt: 0.08,
    bumpFreq: 4,
    swayAmp: 0.08,
    swayFreq: 1.3,
    push: 0.35,
    fadeStart: 55,
    fadeEnd: 70,
  });
  assets.materials.mush = createVegetationMaterial(assets.uniforms, {
    swayAmp: 0,
    rim: 0.2,
    fadeStart: 40,
    fadeEnd: 50,
  });
  assets.materials.log = createVegetationMaterial(assets.uniforms, {
    map: assets.barkTexture,
    swayAmp: 0,
    castShadow: true,
  });
}
