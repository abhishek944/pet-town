/** Cached effect textures, instanced billboards, decals, smoke, campfire particles and pooled lights. */
import { propsState } from "../state.js";
export function preparePropsEffects() {
  propsState.smokeParticleTextureCache = null;
  propsState.glowParticleTextureCache = null;
  propsState.flameParticleTextureCache = null;
  propsState.propBillboardVertexShader = `
#include <common>
#include <fog_pars_vertex>
attribute vec3 iPos; attribute vec2 iScale; attribute vec4 iColor; attribute float iRot;
uniform vec2 uCenter;
varying vec2 vUv; varying vec4 vColor;
void main() {
  vUv = uv; vColor = iColor;
  vec4 mvPosition = modelViewMatrix * vec4(iPos, 1.0);
  vec2 p = (position.xy - (uCenter - 0.5)) * iScale;
  float c = cos(iRot), s = sin(iRot);
  mvPosition.xy += vec2(c * p.x - s * p.y, s * p.x + c * p.y);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
  propsState.propBillboardFragmentShader = `
#include <common>
#include <fog_pars_fragment>
uniform sampler2D map; uniform float uCut;
varying vec2 vUv; varying vec4 vColor;
void main() {
  vec4 t = texture2D(map, vUv);
  gl_FragColor = vec4(t.rgb * vColor.rgb, t.a * vColor.a);
  if (gl_FragColor.a < max(uCut, 0.004)) discard;
  if (uCut > 0.0) gl_FragColor.a = 1.0;
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #include <fog_fragment>
}`;
  propsState.propDecalVertexShader = `
attribute vec3 iPos; attribute vec2 iScale; attribute vec4 iColor; attribute float iRot;
varying vec2 vUv; varying vec4 vColor;
void main() {
  vUv = uv; vColor = iColor;
  vec2 p = position.xy * iScale; float c = cos(iRot), s = sin(iRot);
  vec3 w = iPos + vec3(c * p.x - s * p.y, 0.0, s * p.x + c * p.y);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(w, 1.0);
}`;
  propsState.propDecalFragmentShader = `
uniform sampler2D map; uniform float uAmp;
varying vec2 vUv; varying vec4 vColor;
void main() {
  float a = texture2D(map, vUv).a * vColor.a;
  gl_FragColor = vec4(vColor.rgb * uAmp, a * uAmp);
  if (gl_FragColor.a < 0.003) discard;
  #include <colorspace_fragment>
}`;
  propsState.campfireVertexShader = `
attribute float aPhase;
uniform float uTime;
varying vec2 vUv;
void main() {
  vUv = uv;
  vec3 p = position; float h = uv.y;
  float stretch = 1.0 + 0.18 * sin(uTime * 7.3 + aPhase) + 0.1 * sin(uTime * 13.1 + aPhase * 2.3);
  p.y *= stretch;
  p.x += sin(uTime * 2.6 + aPhase + h * 3.0) * 0.06 * h * h;
  p.z += cos(uTime * 2.2 + aPhase * 1.7 + h * 2.5) * 0.06 * h * h;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}`;
  propsState.campfireFragmentShader = `
uniform sampler2D map; uniform vec3 uTint;
varying vec2 vUv;
void main() {
  vec4 t = texture2D(map, vUv);
  gl_FragColor = vec4(t.rgb * uTint, t.a);
  if (gl_FragColor.a < 0.45) discard;
  gl_FragColor.a = 1.0;
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;
}
