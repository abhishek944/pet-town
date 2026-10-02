
uniform vec3 uZenith, uMid, uMidAnti, uHorizon; // display sRGB (uMid toward the sun, uMidAnti away from it)
uniform vec3 uFogLin, uScatterLin;        // linear: fog colour + sun in-scatter lobe (matches fog chunk)
uniform vec3 uSunDir;
float skyScatterPhase(float x) { x = max(x, 0.0); return x * x * x * 0.55 + pow(x, 10.0) * 0.45; }
vec3 skyGradient(vec3 d) {
  float h = clamp(d.y, 0.0, 1.0);
  float lh = length(d.xz);
  float az = lh > 1e-4 ? dot(d.xz / lh, normalize(uSunDir.xz + 1e-5)) * 0.5 + 0.5 : 0.5;
  vec3 mid = mix(uMidAnti, uMid, pow(clamp(az, 0.0, 1.0), 1.5));
  float a = smoothstep(0.0, 0.28, pow(h, 0.7));
  vec3 c = mix(uHorizon, mid, a);
  c = mix(c, uZenith, smoothstep(0.05, 0.6, h));
  return c;
}
// haze colour at/below horizon in a view direction (linear), identical to the patched fog
vec3 skyHaze(vec3 d) { return uFogLin + uScatterLin * skyScatterPhase(dot(normalize(d), uSunDir)); }
