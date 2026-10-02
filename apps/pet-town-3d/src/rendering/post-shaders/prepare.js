/** Custom ambient occlusion, depth of field, light shafts, bloom, composite and color grading shaders. */
import sourceAsset67 from "./assets/prepare-rendering-post-shaders-67.glsl?raw";
import sourceAsset68 from "./assets/prepare-rendering-post-shaders-68.glsl?raw";
import sourceAsset69 from "./assets/prepare-rendering-post-shaders-69.glsl?raw";
import sourceAsset70 from "./assets/prepare-rendering-post-shaders-70.glsl?raw";
import sourceAsset71 from "./assets/prepare-rendering-post-shaders-section-1-71.glsl?raw";
import sourceAsset72 from "./assets/prepare-rendering-post-shaders-section-2-72.glsl?raw";
import sourceAsset73 from "./assets/prepare-rendering-post-shaders-73.glsl?raw";
import { renderingState } from "../state.js";
export function prepareRenderingPostShaders() {
  renderingState.fullscreenVertexShader = `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;
  renderingState.postDepthShaderUtilities = sourceAsset67;
  renderingState.ambientOcclusionFragmentShader = sourceAsset68;
  renderingState.ambientOcclusionBlurFragmentShader = `
uniform sampler2D tAO;
uniform vec2 uDir;
varying vec2 vUv;
void main() {
  vec4 c = texture2D(tAO, vUv);
  float z = c.g;
  float tol = 1.0 / (z * 0.04 + 0.03);
  float sum = c.r, wsum = 1.0;
  for (int i = 1; i <= 4; i++) {
    float g = exp(-float(i * i) / 9.0);
    for (int s = -1; s <= 1; s += 2) {
      vec4 t = texture2D(tAO, vUv + uDir * float(i * s));
      float w = g * max(0.0, 1.0 - abs(t.g - z) * tol);
      sum += t.r * w; wsum += w;
    }
  }
  gl_FragColor = vec4(sum / wsum, z, 0.0, 1.0);
}`;
  renderingState.depthOfFieldDownsampleFragmentShader = `
${renderingState.postDepthShaderUtilities}
uniform sampler2D tScene, tAO;
uniform vec2 uTexel;
uniform float uUseAO;
varying vec2 vUv;
vec4 tap(vec2 uv) {
  vec4 s4 = texture2D(tScene, uv);
  vec3 c = sanitize(s4.rgb);
  if (uUseAO > 0.5) c = applyAO(c, mix(1.0, texture2D(tAO, uv).r, aoMask(s4.a)));
  float w = cocAt(uv, viewZAt(uv)) + 0.002;
  return vec4(c * w, w);
}
void main() {
  gl_FragColor = 0.25 * (tap(vUv + uTexel * vec2(-1.0, -1.0)) + tap(vUv + uTexel * vec2(1.0, -1.0)) +
                         tap(vUv + uTexel * vec2(-1.0, 1.0)) + tap(vUv + uTexel * vec2(1.0, 1.0)));
}`;
  renderingState.kawaseBlurFragmentShader = `
uniform sampler2D tSrc;
uniform vec2 uTexel;
uniform float uOff;
varying vec2 vUv;
void main() {
  vec2 o = uTexel * (uOff + 0.5);
  gl_FragColor = 0.25 * (texture2D(tSrc, vUv + vec2(-o.x, -o.y)) + texture2D(tSrc, vUv + vec2(o.x, -o.y)) +
                         texture2D(tSrc, vUv + vec2(-o.x, o.y)) + texture2D(tSrc, vUv + vec2(o.x, o.y)));
}`;
  renderingState.sunShaftMaskFragmentShader = sourceAsset69;
  renderingState.sunShaftBlurFragmentShader = `
uniform sampler2D tSrc;
uniform vec2 uSunUv;
uniform float uLen;
varying vec2 vUv;
void main() {
  vec2 dir = (uSunUv - vUv) * uLen / 24.0;
  float jit = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
  vec2 uv = vUv + dir * jit;
  vec3 acc = vec3(0.0); float w = 1.0, ws = 0.0;
  for (int i = 0; i < 24; i++) {
    acc += texture2D(tSrc, uv).rgb * w; ws += w;
    uv += dir; w *= 0.94;
  }
  gl_FragColor = vec4(acc / ws, 1.0);
}`;
  renderingState.bloomHighPassFragmentShader = sourceAsset70;
  renderingState.postCompositeFragmentShader =
    sourceAsset71 + String(renderingState.postDepthShaderUtilities) + sourceAsset72;
  renderingState.colorGradeOutputFragmentShader = sourceAsset73;
  renderingState.colorGradeOutputVertexShader = `
precision highp float;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
attribute vec3 position;
attribute vec2 uv;
varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
}
