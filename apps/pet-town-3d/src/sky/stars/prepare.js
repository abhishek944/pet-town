/** Twinkling star shaders and deterministic point-field creation. */
import sourceAsset43 from "./assets/prepare-sky-stars-43.glsl?raw";
import { skyState } from "../state.js";
export function prepareSkyStars() {
  skyState.skyStarsVertexShader = sourceAsset43;
  skyState.skyStarsFragmentShader = `
varying vec3 vColor;
varying float vBright;
varying float vSpike;
void main() {
  vec2 p = gl_PointCoord * 2.0 - 1.0;
  float r2 = dot(p, p);
  float s = mix(1.0, 3.2 / 1.6, vSpike);           // core size relative to sprite for spiky stars
  float core = exp(-r2 * 9.0 * s * s);
  float halo = exp(-r2 * 3.0) * 0.18;
  float spikes = vSpike * (exp(-abs(p.x) * 26.0) + exp(-abs(p.y) * 26.0)) * (1.0 - smoothstep(0.2, 1.0, sqrt(r2))) * 0.55;
  float a = (core + halo + spikes) * vBright;
  if (a < 0.002) discard;
  gl_FragColor = vec4(vColor * a, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;
}
