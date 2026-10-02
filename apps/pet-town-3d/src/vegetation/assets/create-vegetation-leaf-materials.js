/** Cell registration and construction of the procedural vegetation asset and field libraries. */
import { vegetationState } from "../state.js";
import { createBroadleafTexture } from "../textures/create-broadleaf-texture.js";
import { createTreeBarkTexture } from "../textures/create-tree-bark-texture.js";
import { createPineNeedleTexture } from "../textures/create-pine-needle-texture.js";
import { createLeafFringeAtlas } from "../textures/create-leaf-fringe-atlas.js";
import { createPineFringeTexture } from "../textures/create-pine-fringe-texture.js";
import { createVegetationMaterial } from "../materials/create-vegetation-material.js";
export function createVegetationLeafMaterials(assets) {
  assets.uniforms = vegetationState.vegetationRuntimeState.shared;
  assets.leafTexture = createBroadleafTexture(256, 7);
  assets.barkTexture = createTreeBarkTexture(256, 11);
  assets.pineTexture = createPineNeedleTexture(256, 23);
  assets.leafFringeTexture = createLeafFringeAtlas(256, 5);
  assets.pineFringeTexture = createPineFringeTexture(128, 9);
  assets.materials = {};
  assets.materials.grass = createVegetationMaterial(assets.uniforms, {
    side: 2,
    swayAmp: 0.2,
    swayFreq: 1.9,
    push: 1,
    fadeStart: 70,
    fadeEnd: 110,
    nearFade: [0.5, 1.2],
    patch: 0.35,
    trans: 0.5,
    rim: 0.2,
    tipGlow: 1,
  });
  assets.materials.tall = createVegetationMaterial(assets.uniforms, {
    side: 2,
    swayAmp: 0.2,
    swayFreq: 1.5,
    push: 1.05,
    fadeStart: 80,
    fadeEnd: 115,
    nearFade: [0.5, 1.2],
    patch: 0.3,
    trans: 0.5,
    rim: 0.2,
    tipGlow: 1,
  });
  assets.materials.flower = createVegetationMaterial(assets.uniforms, {
    side: 2,
    swayAmp: 0.2,
    swayFreq: 1.7,
    push: 0.85,
    fadeStart: 42,
    fadeEnd: 55,
    normalUp: 0.2,
    rim: 0.15,
    trans: 0.4,
    soft: 0.22,
  });
  assets.foliageStyle = {
    map: assets.leafTexture,
    worldMap: true,
    bump: true,
    toon: true,
    triScale: 0.42,
    bumpAmt: 0.2,
    bumpFreq: 1.25,
    swayAmp: 0.035,
    swayFreq: 1.1,
    rustle: 0.018,
    rim: 0.26,
    trans: 0.6,
    soft: 0.05,
    castShadow: true,
  };
  assets.materials.foliage = createVegetationMaterial(assets.uniforms, assets.foliageStyle);
  assets.blossomStyle = {
    toonWarm: [1.07, 1.03, 0.97],
    toonCool: [0.95, 0.88, 0.93],
  };
  assets.materials.blossom = createVegetationMaterial(assets.uniforms, {
    ...assets.foliageStyle,
    trans: 0.6,
    soft: 0.3,
    ...assets.blossomStyle,
  });
  assets.materials.autumn = createVegetationMaterial(assets.uniforms, {
    ...assets.foliageStyle,
    trans: 0.65,
    soft: 0.1,
    toonWarm: [1.08, 1.02, 0.9],
    toonCool: [0.9, 0.84, 0.88],
  });
  assets.fringeStyle = {
    map: assets.leafFringeTexture,
    billboard: true,
    toon: true,
    alphaTest: 0.5,
    swayAmp: 0.035,
    swayFreq: 1.1,
    rustle: 0.03,
    rim: 0.18,
    trans: 0.6,
    soft: 0.05,
    fadeStart: 45,
    fadeEnd: 60,
  };
  assets.materials.fringe = createVegetationMaterial(assets.uniforms, assets.fringeStyle);
  assets.materials.fringeBlossom = createVegetationMaterial(assets.uniforms, {
    ...assets.fringeStyle,
    soft: 0.3,
    ...assets.blossomStyle,
  });
  assets.materials.fringeAutumn = createVegetationMaterial(assets.uniforms, {
    ...assets.fringeStyle,
    trans: 0.65,
    soft: 0.1,
    toonWarm: [1.08, 1.02, 0.9],
    toonCool: [0.9, 0.84, 0.88],
  });
  assets.materials.fringePine = createVegetationMaterial(assets.uniforms, {
    ...assets.fringeStyle,
    map: assets.pineFringeTexture,
    toonWarm: [1.06, 1.04, 0.94],
    toonCool: [0.84, 0.9, 1],
    swayAmp: 0.03,
    swayFreq: 0.9,
    rustle: 0.012,
    rim: 0.2,
    trans: 0.2,
    soft: 0.05,
  });
}
