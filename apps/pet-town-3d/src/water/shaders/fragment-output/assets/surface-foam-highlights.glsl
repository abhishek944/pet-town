  // ---- foam: lacy shore line, wash zone (sea) / one faint lap line (ponds), flow streaks ---
  float thin = mix(1.0, 0.5, smoothstep(0.7, 1.5, shoreV.y));
  vec2 fp = wP.xz;
  vec2 lp = wP.xz * 5.2 + vec2(wt * 0.21, -wt * 0.16);
  if (flowL > 0.02) {
    // stretch the lace along the current and advect it downstream
    vec2 fd = flow / flowL, fq = vec2(-fd.y, fd.x);
    vec2 adv = wP.xz - flow * wt * 0.9;
    lp = mix(lp, vec2(dot(adv, fd) * 1.6, dot(adv, fq) * 7.0), smoothstep(0.02, 0.3, flowL));
  }
  float fb1 = w_vnoise(fp * 0.85 + vec2(wt * 0.05, -wt * 0.04));
  float fb2 = w_vnoise(fp * 2.1 - vec2(wt * 0.09, wt * 0.07));
  float fbm = fb1 * 0.65 + fb2 * 0.35;
  float lace = w_vnoise(lp) * 0.65 + w_vnoise(lp * 2.3 + 5.1) * 0.35;
  float edgeW = (mix(0.05, 0.08, openW) + 0.2 * fbm + 0.03 * sin(wt * 1.1 + fbm * 6.0)) * thin * mix(1.0, 1.7, openW);
  // beyond ~0.25 blocks use the blurred coast field so foam stops tracing every block step
  float sdF = mix(sd, max(coastD - 0.5, 0.0), smoothstep(0.02, 0.15, sd));
  float wallK = smoothstep(0.7, 1.5, shoreV.y);
  float edge = 1.0 - smoothstep(edgeW * 0.35, edgeW + 0.03 + sdAA, sdF);
  float solid = (1.0 - smoothstep(0.0, 0.05, sd)) * (1.0 - wallK);
  edge *= mix(0.5 + 0.5 * smoothstep(0.25, 0.75, lace), 1.0, solid) * mix(1.0, 0.6, wallK);
  float glow = (1.0 - smoothstep(0.0, edgeW + 0.35, sdF)) * 0.06;

  // distance used by the wash lines: smooth field (exact only right at the shore)
  float dW = sdF;
  float lap = 0.0;
  // ponds / rivers: one faint lap line drifting out
  {
    float ph = fract(wt * 0.12 + fbm * 0.2);
    float x = dW - (0.2 + ph * 0.9) - (fbm - 0.5) * 0.25;
    float fx = max(fwidth(x), 1e-4);
    float line = 1.0 - smoothstep(0.06, 0.1 + fx * 1.5, abs(x));
    float alive = smoothstep(0.0, 0.15, ph) * (1.0 - ph) * (1.0 - ph) * (1.0 - smoothstep(0.15, 0.4, fx));
    float brk = smoothstep(0.35, 0.65, w_vnoise(wP.xz * 1.3 + vec2(wt * 0.05)));
    lap = line * alive * brk * 0.35 * (1.0 - openW);
  }
  // open sea: advancing foam lines in a 3.5-block wash zone, breaking into foam at the swash
  if (openW > 0.02) {
    for (int k = 0; k < 2; k++) {
      float ph = fract(wt * 0.085 + float(k) / 2.0 + (fb1 - 0.5) * 0.12);
      float lineD = mix(2.4, 0.15, ph) + (fb2 - 0.5) * 0.35;
      float x = dW - lineD - (fbm - 0.5) * 0.45;
      float wl = mix(0.035, 0.09, ph);
      float fx = max(fwidth(x), 1e-4);
      float line = 1.0 - smoothstep(wl, wl + max(fx * 1.5, 0.03), abs(x));
      float alive = smoothstep(0.1, 0.35, ph) * (1.0 - smoothstep(0.8, 1.0, ph));
      float brk = smoothstep(0.35, 0.6, w_vnoise(wP.xz * vec2(1.1, 1.4) + float(k) * 11.3 + vec2(wt * 0.03, 0.0)));
      float ls = smoothstep(0.25, 0.7, lace) * 0.7 + 0.3;
      float farF = 1.0 - smoothstep(0.12, 0.35, fx);             // sub-pixel lines fade out instead of dotting
      lap = max(lap, line * alive * brk * ls * openW * mix(0.25, 0.6, ph) * farF);
    }
    // swash: foamy sheet where the last line breaks
    float sw = (1.0 - smoothstep(0.15, 0.9 + 0.45 * fbm, dW)) * smoothstep(0.25, 0.65, lace) * 0.55 * openW;
    lap = max(lap, sw);
  }
  // river: streaky foam along the banks
  float streak = 0.0;
  if (flowL > 0.02) {
    streak = (1.0 - smoothstep(0.1, 0.9, sdF)) * smoothstep(0.55, 0.8, lace) * smoothstep(0.02, 0.3, flowL) * 0.55;
  }
  // sparse whitecaps on swell crests out at sea
  float cap0 = 0.0;
  if (openW > 0.5) {
    float crest = swell(wP.xz, wt).x * w_swellMod(wP.xz, wt) / 0.12;
    float wcN = w_vnoise(wP.xz * 0.45 + vec2(wt * 0.05, -wt * 0.03));
    cap0 = smoothstep(0.7, 0.95, crest) * smoothstep(0.8, 0.95, wcN) * smoothstep(0.5, 0.7, lace)
         * smoothstep(5.0, 10.0, coastD) * openW * smoothstep(0.05, 0.3, lodN) * 0.6;
  }
  float foam = max(max(edge * mix(0.45, 0.75, openW), glow), max(max(lap, streak), cap0));
  foam = max(foam, clamp(ringFoam, 0.0, 1.0) * 0.75);
  foam = min(foam, 0.78) * uTune2.x;
  // foam: mostly neutral light (no lavender cast in shade) and never darker than the water it sits on
  vec3 foamCol = uFoam * mix(vec3(dot(Ldiff, LUMA)), Ldiff, 0.35);
  foamCol = max(foamCol, col * 1.12 + 0.04 * Ldiff);
  col = mix(col, foamCol, foam);

  // ---- sun / moon specular + glint streak ----------------------------------------------
  vec3 H = normalize(uSunDir + wV);
  float NdH = max(dot(N, H), 0.0);
  float daySpec = pow(NdH, 2200.0) * 1.5 + pow(NdH, 900.0) * 0.3;
  // moon: a thin, broken glitter path (tight lobe, high-frequency breakup) rather than bright slabs
  float moonBreak = smoothstep(0.55, 0.8, w_vnoise(wP.xz * 3.5 + vec2(wt * 0.6, 0.0)));
  float nightSpec = (pow(NdH, 700.0) * 5.0 * moonBreak + pow(NdH, 90.0) * 0.08)
                  * mix(1.0, 0.35, smoothstep(0.3, 0.7, R.y));          // high cameras: sparse glitter, no patch
  float spec = mix(daySpec, nightSpec, uNight) * uTune2.z;
  float path = pow(max(dot(R, uSunDir), 0.0), 24.0);                 // streak toward the reflected sun
  float glit = w_glints(wP.xz, H, wt, 2.1) + 0.6 * w_glints(wP.xz + 3.7, H, wt * 1.3, 3.7);
  glit *= path * 7.0 * uTune.w * smoothstep(0.0, 0.25, lodN) * smoothstep(0.3, 0.9, sd) * mix(1.0, 0.6 * (1.0 - smoothstep(0.1, 0.55, R.y)), uNight);
  float sunUp = smoothstep(-0.02, 0.12, uSunDir.y);
  if (uNight > 0.01) {
    vec2 rh = normalize(R.xz + vec2(1e-5)), mh = normalize(uSunDir.xz + vec2(1e-5));
    float az = pow(max(dot(rh, mh), 0.0), 500.0);                    // thin column under the moon
    float lowR = 1.0 - smoothstep(0.05, 0.6, R.y);                   // only toward the horizon (no slab from above)
    float dash = smoothstep(0.55, 0.8, w_vnoise(wP.xz * vec2(0.9, 0.9) + vec2(wt * 0.35, -wt * 0.2)))
               * smoothstep(0.35, 0.6, w_vnoise(wP.xz * 2.6 - vec2(wt * 0.5, 0.0)));
    spec += az * lowR * dash * 0.9 * uNight;
  }
  vec3 hl = uSunColor * (spec + glit) * sunVis * sunUp * (1.0 - clamp(foam, 0.0, 1.0));
  col += min(hl, vec3(mix(2.5, 2.5, uNight)));

  // ---- far edge fade into whatever is behind (sky / fog) --------------------------------
  float fdist = length(wP.xz - cameraPosition.xz);
  col = mix(col, behind, smoothstep(uFade.x, uFade.y, fdist));

  int dbg = int(uTune2.w + 0.5);
  if (dbg == 1) col = vec3(depth / 6.0);
  else if (dbg == 2) col = vec3(sd / 2.6);
  else if (dbg == 3) col = N * 0.5 + 0.5;
  else if (dbg == 4) col = vec3(caus * cAmt);
  else if (dbg == 5) col = vec3(sunVis);
  else if (dbg == 6) col = vec3(foam);
  else if (dbg == 7) col = Ldiff;
  else if (dbg == 8) col = vec3(openW, coastD / 16.0, 0.0);
  else if (dbg == 9) col = vec3(flow * 0.5 + 0.5, 0.0);

  // alpha 0.5 marks water pixels in the (opaque) scene target so post can skip SSAO on the surface
  gl_FragColor = vec4(col, uAlphaOut);
}
