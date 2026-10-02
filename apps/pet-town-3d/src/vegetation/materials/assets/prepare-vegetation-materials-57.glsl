
attribute float aSway;
attribute float aTint;
#ifdef VEG_BILLBOARD
attribute vec3 aCard; // corner offset xy (view plane, pre-rotated) + size
#endif
#ifdef VEG_MERGED
attribute vec3 aOrigin; // world-space plant origin baked into merged (non-instanced) geometry
#endif
uniform float uTime;
uniform vec3 uWind;
uniform float uGust;
uniform vec4 uPushers[6];
uniform float uSwayAmp;
uniform float uSwayFreq;
uniform float uRustle;
uniform float uPushAmt;
uniform vec2 uFade;
uniform vec2 uNearFade;
uniform vec3 uTierScale;   // quality-tier compensation: thinner tiers get wider / taller tufts
uniform float uBob;
uniform float uPatch;
uniform float uNormalUp;
varying float vTint;
varying float vSwayW;
#if defined(VEG_WORLDMAP) || defined(VEG_BUMP)
varying vec3 vWPos0;
varying vec3 vWN0;
#endif
#ifdef VEG_FADE
varying vec3 vFadeW;
#endif

mat4 vegModel() {
  #ifdef USE_INSTANCING
    return modelMatrix * instanceMatrix;
  #else
    return modelMatrix;
  #endif
}
vec3 vegOrigin() {
  #ifdef VEG_MERGED
    return (modelMatrix * vec4(aOrigin, 1.0)).xyz;
  #else
    return (vegModel() * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
  #endif
}
float vegHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vegNoise(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(vegHash(i), vegHash(i + vec2(1, 0)), f.x), mix(vegHash(i + vec2(0, 1)), vegHash(i + vec2(1, 1)), f.x), f.y);
}
vec3 vegDisplace(vec3 o, vec3 lp, float w) {
  vec3 disp = vec3(0.0);
  if (w <= 0.0) return disp;
  vec2 wd = normalize(uWind.xy + 1e-5);
  float t = uTime;
  // Large travelling gusts (visible waves rolling over grass) + per-plant flutter.
  float along = dot(o.xz, wd);
  float gust = vegNoise(vec2(along * 0.07 - t * 0.55, dot(o.xz, vec2(-wd.y, wd.x)) * 0.05));
  gust = smoothstep(0.25, 0.95, gust) * uGust;
  float ph = vegHash(floor(o.xz * 3.0)) * 6.2831;
  float flutter = sin(t * uSwayFreq + ph + along * 0.6) * 0.6 + sin(t * uSwayFreq * 2.17 + ph * 1.7) * 0.25;
  float bend = (0.35 + gust * 1.4) * uWind.z;
  disp.xz = wd * (bend + flutter * (0.35 + 0.65 * gust)) * uSwayAmp * w;
  disp.xz += vec2(-wd.y, wd.x) * sin(t * uSwayFreq * 1.3 + ph * 2.3) * 0.18 * uSwayAmp * w;
  // Leaf rustle: small high-frequency per-vertex jitter (canopies).
  if (uRustle > 0.0) {
    vec3 q = lp * 2.3 + o * 0.7;
    disp += vec3(sin(t * 3.1 + q.x + q.y), sin(t * 2.6 + q.y * 1.3 + q.z) * 0.6, cos(t * 3.4 + q.z + q.x)) * uRustle * w * (0.5 + gust);
  }
  // Player / creature push: flatten well beyond the body radius so small creatures stay visible.
  if (uPushAmt > 0.0) {
    for (int i = 0; i < 6; i++) {
      vec4 P = uPushers[i];
      if (P.w <= 0.0) continue;
      vec3 d = o - P.xyz;
      float dist = length(d.xz);
      float f = (1.0 - smoothstep(P.w * 0.5, P.w * 1.8, dist)) * (1.0 - smoothstep(0.6, 2.2, abs(d.y)));
      vec2 dir = dist > 1e-3 ? d.xz / dist : vec2(1.0, 0.0);
      disp.xz += dir * f * uPushAmt * w;
      disp.y -= f * uPushAmt * w * 0.55;
    }
  }
  // Keep blade length roughly constant when bent.
  disp.y -= dot(disp.xz, disp.xz) * 0.45;
  // Water bob (lily pads).
  if (uBob > 0.0) disp.y += sin(t * 1.4 + o.x * 0.9 + o.z * 1.3) * uBob;
  return disp;
}
vec3 vegToLocal(vec3 disp) {
  mat3 m3 = mat3(vegModel());
  return vec3(dot(m3[0], disp) / dot(m3[0], m3[0]), dot(m3[1], disp) / dot(m3[1], m3[1]), dot(m3[2], disp) / dot(m3[2], m3[2]));
}
