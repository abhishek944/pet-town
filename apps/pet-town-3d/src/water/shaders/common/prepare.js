/** Ripple timing, shared surface declarations, procedural wave helpers and vertex displacement. */
import sourceAsset49 from "./assets/prepare-water-shaders-common-section-1-49.glsl?raw";
import sourceAsset50 from "./assets/prepare-water-shaders-common-section-2-50.glsl?raw";
import { waterState } from "../../state.js";
export function prepareWaterShadersCommon() {
  waterState.waterRippleLifetime = 2.8;
  waterState.waterRippleSpeed = 1.35;
  waterState.waterSurfaceCommonShader =
    sourceAsset49 + String(waterState.waterSwellShader) + sourceAsset50;
  waterState.waterSurfaceVertexDeclarations = waterState.waterSurfaceCommonShader;
  waterState.waterSurfaceVertexTransform = `
#include <begin_vertex>
{
  vec3 wp0 = (modelMatrix * vec4(transformed, 1.0)).xyz;
  vec4 hs0 = textureLod(uHeightTex, (wp0.xz - uHeightRect.xy) / uHeightRect.zw, 0.0);
  float dep0 = max(uSurfaceY - hs0.g, 0.0);
  float amp0 = smoothstep(0.15, 1.6, dep0) * (1.0 - 0.6 * hs0.a) * w_swellMod(wp0.xz, uTime);
  transformed.y += swell(wp0.xz, uTime).x * amp0;
  vWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
}
`;
}
