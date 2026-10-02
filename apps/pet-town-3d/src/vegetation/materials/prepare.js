/** Vegetation shared uniforms, shader chunks, wind displacement, camera fading and material assembly. */
import sourceAsset57 from "./assets/prepare-vegetation-materials-57.glsl?raw";
import sourceAsset58 from "./assets/prepare-vegetation-materials-58.glsl?raw";
import sourceAsset59 from "./assets/prepare-vegetation-materials-59.glsl?raw";
import sourceAsset60 from "./assets/prepare-vegetation-materials-60.glsl?raw";
import sourceAsset61 from "./assets/prepare-vegetation-materials-61.glsl?raw";
import sourceAsset62 from "./assets/prepare-vegetation-materials-62.glsl?raw";
import sourceAsset63 from "./assets/prepare-vegetation-materials-63.glsl?raw";
import { vegetationState } from "../state.js";
export function prepareVegetationMaterials() {
  vegetationState.vegetationVertexCommonShader = sourceAsset57;
  vegetationState.vegetationVertexDisplacementShader = sourceAsset58;
  vegetationState.vegetationVertexProjectionShader = sourceAsset59;
  vegetationState.vegetationVertexColorShader = sourceAsset60;
  vegetationState.vegetationFragmentCommonShader = sourceAsset61;
  vegetationState.vegetationFragmentDiffuseShader = sourceAsset62;
  vegetationState.vegetationFragmentNormalShader = `
#include <normal_fragment_maps>
#ifdef VEG_BUMP
{
  // (no branches around derivatives: they must run in uniform control flow)
  float bumpFade = 1.0 - smoothstep(60.0, 120.0, length(vViewPosition));
  float h = gClump * uBumpAmt * bumpFade / max(uBumpFreq, 0.5);
  normal = vegPerturb(-vViewPosition, normal, vec2(dFdx(h), dFdy(h)), faceDirection);
}
#endif
`;
  vegetationState.vegetationFragmentLightingShader = sourceAsset63;
  vegetationState.vegetationVertexNormalShader = `
vec3 objectNormal = normalize(mix(vec3(normal), vec3(0.0, 1.0, 0.0), uNormalUp));
#ifdef USE_TANGENT
  vec3 objectTangent = vec3( tangent.xyz );
#endif
`;
}
