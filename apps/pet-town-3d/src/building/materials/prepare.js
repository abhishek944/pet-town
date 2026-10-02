/** Block selection outlines, face textures and physical materials. */
import { buildingState } from "../state.js";
export function prepareBuildingMaterials() {
  buildingState.blockOutlineVertexShader = `varying vec2 vUv; varying vec3 vN; void main(){ vUv=uv; vN=normal; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`;
  buildingState.blockOutlineFragmentShader = `uniform vec3 uColor; uniform float uTime, uOpacity, uFill, uLine, uGlow; uniform vec3 uFace; varying vec2 vUv; varying vec3 vN;
void main(){
  vec2 q = min(vUv, 1.0 - vUv); float d = min(q.x, q.y); float w = fwidth(d) * 1.25;
  float line = 1.0 - smoothstep(uLine - w, uLine + w, d);
  float pulse = 0.78 + 0.22 * sin(uTime * 5.0);
  float glow = exp(-d * 16.0) * uGlow * pulse;
  float face = step(0.9, dot(normalize(vN), uFace)) * (0.07 + 0.05 * pulse);
  float a = clamp(max(line * 0.95, glow) + uFill + face, 0.0, 1.0) * uOpacity;
  gl_FragColor = vec4(uColor, a);
}`;
  buildingState.blockFaceTextureCache = new Map();
  buildingState.blockMaterialCache = new Map();
}
