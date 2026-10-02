
#include <packing>
uniform highp sampler2D tDepth;
uniform vec2 uFullRes;
uniform mat4 uProjInv;
uniform float uProj11, uRadius, uIntensity, uMaxPx, uBias, uPower;
varying vec2 vUv;
vec3 vpos(vec2 uv, float d) { vec4 p = uProjInv * vec4(vec3(uv, d) * 2.0 - 1.0, 1.0); return p.xyz / p.w; }
// always fetch exactly at full-res texel centres (half-res pixel centres sit on texel edges -> striping)
vec2 snapUv(vec2 uv) { return (floor(uv * uFullRes) + 0.5) / uFullRes; }
vec3 vposAt(vec2 uv) { uv = snapUv(uv); return vpos(uv, texture2D(tDepth, uv).x); }
float ign(vec2 p) { return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))); }
void main() {
  vec2 uv0 = snapUv(vUv);
  float d = texture2D(tDepth, uv0).x;
  if (d >= 0.999999) { gl_FragColor = vec4(1.0, 60000.0, 0.0, 1.0); return; }
  vec3 P = vpos(uv0, d);
  vec2 tx = 1.0 / uFullRes;
  vec3 pr = vposAt(uv0 + vec2(tx.x, 0.0)), pl = vposAt(uv0 - vec2(tx.x, 0.0));
  vec3 pu = vposAt(uv0 + vec2(0.0, tx.y)), pd = vposAt(uv0 - vec2(0.0, tx.y));
  vec3 dx = abs(pr.z - P.z) < abs(P.z - pl.z) ? pr - P : P - pl;
  vec3 dy = abs(pu.z - P.z) < abs(P.z - pd.z) ? pu - P : P - pd;
  vec3 N = normalize(cross(dx, dy));
  float rPx = min(uRadius * uProj11 * 0.5 * uFullRes.y / -P.z, uMaxPx);
  float occ = 0.0;
  if (rPx > 1.0) {
    float rot = ign(gl_FragCoord.xy) * 6.2831853;
    float jit = fract(ign(gl_FragCoord.yx + 17.0) + 0.5);
    float r2 = uRadius * uRadius;
    for (int i = 0; i < AO_SAMPLES; i++) {
      float fi = float(i);
      float t = (fi + jit) / float(AO_SAMPLES);
      float ang = rot + fi * 2.39996323;
      vec2 off = vec2(cos(ang), sin(ang)) * (mix(t, sqrt(t), 0.5) * rPx + 1.0);
      vec3 S = vposAt(uv0 + off * tx);
      vec3 v = S - P;
      float vv = dot(v, v);
      float vn = dot(v, N) * inversesqrt(vv + 1e-5);
      float fall = clamp(1.0 - vv / r2, 0.0, 1.0);
      occ += max(vn - uBias, 0.0) * fall;
    }
    occ /= float(AO_SAMPLES);
  }
  float ao = pow(clamp(1.0 - occ * uIntensity, 0.0, 1.0), uPower);
  #ifdef AO_DEBUG_NORMAL
  ao = N.y * 0.5 + 0.5;
  #endif
  gl_FragColor = vec4(ao, -P.z, 0.0, 1.0);
}
