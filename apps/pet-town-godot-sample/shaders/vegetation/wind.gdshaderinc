// Original travelling gusts, per-plant flutter, leaf rustle and player push.
float vegHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vegNoise(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(vegHash(i), vegHash(i + vec2(1, 0)), f.x), mix(vegHash(i + vec2(0, 1)), vegHash(i + vec2(1, 1)), f.x), f.y);
}
vec3 vegDisplace(vec3 o, vec3 lp, float w) {
  vec3 disp = vec3(0.0);
  if (w <= 0.0) return disp;
  vec2 wd = normalize(weather_wind.xy + 1e-5);
  float t = weather_wind_time >= 0.0 ? weather_wind_time : TIME;
  float energy = smoothstep(0.24, 1.15, weather_wind.z);
  // Large travelling gusts (visible waves rolling over grass) + per-plant flutter.
  float along = dot(o.xz, wd);
  float gust = vegNoise(vec2(along * 0.07 - t * 0.55, dot(o.xz, vec2(-wd.y, wd.x)) * 0.05));
  gust = smoothstep(0.25, 0.95, gust) * (0.85+0.25*sin(t*0.13)+0.1*sin(t*0.041+1.3));
  // Broad rolling pulses become readable in strong wind, while calm stays gentle.
  float wave = pow(0.5 + 0.5 * sin(along * 0.38 - t * 1.7 + vegNoise(o.xz * 0.025) * 1.8), 2.0);
  gust = mix(gust, gust * 0.55 + wave * 0.85, energy);
  float ph = vegHash(floor(o.xz * 3.0)) * 6.2831;
  float flutter = sin(t * uSwayFreq + ph + along * 0.6) * 0.6 + sin(t * uSwayFreq * 2.17 + ph * 1.7) * 0.25;
  float bend = (0.35 + gust * 1.4) * uWind.z * (0.45 + weather_wind.z * 1.6);
  disp.xz = wd * (bend + flutter * (0.35 + 0.65 * gust) * (1.0 + energy * 1.5) * weather_motion) * uSwayAmp * w;
  disp.xz += vec2(-wd.y, wd.x) * sin(t * uSwayFreq * 1.3 + ph * 2.3) * 0.18 * (1.0 + energy * 0.8) * weather_motion * uSwayAmp * w;
  // Leaf rustle: small high-frequency per-vertex jitter (canopies).
  if (uRustle > 0.0) {
    vec3 q = lp * 2.3 + o * 0.7;
    disp += vec3(sin(t * 3.1 + q.x + q.y), sin(t * 2.6 + q.y * 1.3 + q.z) * 0.6, cos(t * 3.4 + q.z + q.x)) * uRustle * w * (0.5 + gust) * (1.0 + energy * 2.5) * weather_motion;
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
