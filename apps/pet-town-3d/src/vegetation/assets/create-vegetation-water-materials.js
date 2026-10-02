/** Cell registration and construction of the procedural vegetation asset and field libraries. */
import { vegetationState } from "../state.js";
import { createVegetationMaterial } from "../materials/create-vegetation-material.js";
import { createVegetationBlobShadowMaterial } from "../textures/create-vegetation-blob-shadow-material.js";
export function createVegetationWaterMaterials(assets) {
  assets.materials.lily = createVegetationMaterial(assets.uniforms, {
    side: 2,
    transparent: true,
    swayAmp: 0.02,
    swayFreq: 0.8,
    bob: 0.018,
    fadeStart: 80,
    fadeEnd: 100,
    normalUp: 0.3,
    soft: 0.14,
    rim: 0.12,
  });
  assets.materials.reed = createVegetationMaterial(assets.uniforms, {
    refract: true,
    side: 2,
    swayAmp: 0.16,
    swayFreq: 1.3,
    push: 0.7,
    fadeStart: 75,
    fadeEnd: 90,
    trans: 0.5,
    rim: 0.2,
    tipGlow: 1,
  });
  assets.materials.proxy = createVegetationMaterial(assets.uniforms, {
    merged: true,
    castShadow: true,
    swayAmp: 0.035,
    swayFreq: 1.1,
    rustle: 0.01,
    soft: 0.06,
    rim: 0.15,
  });
  assets.materials.blob = createVegetationBlobShadowMaterial();
  vegetationState.vegetationRuntimeState.materials = assets.materials;
  vegetationState.vegetationRuntimeState.textures = [
    assets.leafTexture,
    assets.barkTexture,
    assets.pineTexture,
    assets.leafFringeTexture,
    assets.pineFringeTexture,
  ];
  for (let result of Object.values(assets.materials)) {
    if (result.uniforms?.uFade) {
      result.baseFade = result.uniforms.uFade.value.clone();
    }
  }
}
