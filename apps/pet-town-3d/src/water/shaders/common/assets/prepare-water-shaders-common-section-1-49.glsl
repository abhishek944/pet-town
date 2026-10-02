
uniform float uTime;
uniform float uSurfaceY;
uniform sampler2D uHeightTex;
uniform sampler2D uWaterTex;
uniform vec4 uHeightRect;
varying vec3 vWPos;
float w_hash12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float w_vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f);
  return mix(mix(w_hash12(i), w_hash12(i + vec2(1.0, 0.0)), u.x), mix(w_hash12(i + vec2(0.0, 1.0)), w_hash12(i + vec2(1.0, 1.0)), u.x), u.y);
}
// large-scale swell modulation so the open sea doesn't read as regular stripes
float w_swellMod(vec2 p, float t) { return 0.45 + 0.75 * w_vnoise(p * 0.035 + vec2(t * 0.011, -t * 0.008)); }
