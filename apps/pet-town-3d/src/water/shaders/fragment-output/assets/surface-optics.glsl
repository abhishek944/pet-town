
{
  const vec3 LUMA = vec3(0.2126, 0.7152, 0.0722);
  vec3 wP = vWPos;
  vec3 wToCam = cameraPosition - wP;
  float wViewDist = length(wToCam);
  vec3 wV = wToCam / wViewDist;
  float wt = uTime;

  // ---- terrain / depth ----------------------------------------------------------------
  vec2 huv = (wP.xz - uHeightRect.xy) / uHeightRect.zw;
  bool inTex = huv.x >= 0.0 && huv.y >= 0.0 && huv.x <= 1.0 && huv.y <= 1.0;
  // never draw water inside a solid column (e.g. camera clipped into a hill)
  if (inTex && w_bedExact(floor(wP.xz)) > uSurfaceY + 0.01) discard;
  vec4 hs = texture2D(uHeightTex, huv);
  vec4 ws = texture2D(uWaterTex, huv);
  float bedS = inTex ? hs.g : uSurfaceY - 40.0;
  float voidW = inTex ? hs.b : 1.0;
  float landNear = inTex ? hs.a : 0.0;
  float coastD = inTex ? max(ws.r, 0.0) * 16.0 : 40.0;
  vec2 flow = inTex ? ws.gb : vec2(0.0);
  float openW = inTex ? ws.a : 1.0;
  float flowL = length(flow);
  float depth = max(uSurfaceY - bedS, 0.0);                          // shading depth (colour)
  float depthT = inTex ? max(uSurfaceY - hs.r, 0.0) : 40.0;          // true depth (path length / attenuation)
  float depthP = max(depth, depthT);
  vec2 shoreV = inTex ? w_shore(wP.xz) : vec2(2.6, 0.0);
  float sd = shoreV.x;
  float sdAA = max(fwidth(sd), 0.002);
  float lodN = 1.0 / (1.0 + wViewDist * 0.015);

  // ---- surface normal -----------------------------------------------------------------
  float ampS = smoothstep(0.15, 1.6, depth) * (1.0 - 0.6 * landNear) * w_swellMod(wP.xz, wt);
  vec2 g = swell(wP.xz, wt).yz * ampS;
  float calmShore = mix(0.55, 1.0, smoothstep(0.0, 1.0, sd));
  vec2 det = w_detail(wP.xz, wt, lodN);
  if (flowL > 0.02) {
    // two-phase flow map: detail scrolls downstream, phases cross-faded to hide the reset
    float cyc = wt * 0.3;
    float ph0 = fract(cyc), ph1 = fract(cyc + 0.5);
    float wb = abs(ph0 - 0.5) * 2.0;
    vec2 d0 = w_detail(wP.xz - flow * ph0 * 2.2, wt * 0.4, lodN);
    vec2 d1 = w_detail(wP.xz - flow * ph1 * 2.2 + 0.37, wt * 0.4, lodN);
    det = mix(det, mix(d0, d1, wb) * 1.15, smoothstep(0.02, 0.25, flowL));
  }
  g += det * calmShore;

  float ringFoam = 0.0;
  for (int i = 0; i < MAX_RIPPLES; i++) {
    vec4 r = uRipples[i];
    float age = wt - r.z;
    if (r.w <= 0.0 || age < 0.0 || age > RIPPLE_LIFE) continue;
    vec2 d = wP.xz - r.xy;
    float dist = length(d) + 1e-4;
    float front = age * RIPPLE_SPEED * (0.75 + 0.25 * min(r.w, 2.0));
    float x = dist - front;
    float life = 1.0 - age / RIPPLE_LIFE;
    float env = min(r.w, 2.0) * life * life / (1.0 + dist * 0.35);
    float sig = 5.0 / (1.0 + age * 1.5);
    float gauss = exp(-x * x * sig);
    const float K = 8.5;
    float dh = 0.07 * env * (K * cos(K * x) - 2.0 * sig * x * sin(K * x)) * gauss;
    g += (d / dist) * dh;
    float wob = 0.7 + 0.3 * sin(atan(d.y, d.x) * 7.0 + r.x * 3.0 + age * 2.0);
    float rw = 90.0 / (1.0 + age * 0.9);
    float fenv = min(r.w, 1.5) * pow(life, 1.3) / (1.0 + dist * 0.15);
    float x2 = x + 0.45;
    ringFoam += fenv * wob * (exp(-x * x * rw) + 0.5 * exp(-x2 * x2 * rw * 1.3)) * smoothstep(0.0, 0.15, age);
  }
  vec3 N = normalize(vec3(-g.x, 1.0, -g.y));

  // ---- lighting from three's light loop (flat white lambert surface) --------------------
  vec3 Ldiff = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
  float expectSun = dot(uSunColor, LUMA) * max(uLightDir.y, 0.0) * RECIPROCAL_PI * 0.98;
  float sunVis = expectSun > 1e-4 ? clamp(dot(reflectedLight.directDiffuse, LUMA) / expectSun, 0.0, 1.0) : 0.0;

  // ---- refraction ---------------------------------------------------------------------
  const float W_ETA = 1.0 / 1.33;
  vec3 rdFlat = refract(-wV, vec3(0.0, 1.0, 0.0), W_ETA);
  vec3 rdN = refract(-wV, N, W_ETA);
  float cosT = max(-rdFlat.y, 0.3);
  float tb = min(depthP, 8.0) / cosT;
  float shoreK = smoothstep(0.02, 0.6, sd);
  vec3 offW = (rdN - rdFlat) * min(tb, 3.0) * uTune.x * shoreK;
  mat4 VP = projectionMatrix * viewMatrix;
  vec4 c0 = VP * vec4(wP, 1.0);
  vec4 c1 = VP * vec4(wP + offW, 1.0);
  vec2 uv0 = c0.xy / c0.w * 0.5 + 0.5;
  vec2 duv = c1.xy / c1.w * 0.5 + 0.5 - uv0;
  float dl = length(duv);
  duv *= min(dl, 0.035) / max(dl, 1e-5);
  vec2 ruv = clamp(uv0 + duv, vec2(0.001), vec2(0.999));
  float lod = clamp(depthP * 0.85, 0.0, 4.0);
  vec3 refr = w_sceneToLinear(textureLod(W_SCENE, ruv, lod).rgb);
  vec3 behind = w_sceneToLinear(textureLod(W_SCENE, clamp(uv0, vec2(0.001), vec2(0.999)), 0.0).rgb);

  // ---- caustics on the bed (evaluated where the refracted view ray lands) ----------------
  vec2 bedXZ = (wP.xz + rdN.xz * tb - flow * wt * 0.5) * 0.8;
  float caa = length(fwidth(bedXZ));
  float caus = w_caustic(bedXZ, wt * 0.55, caa * 1.5) * (1.0 - smoothstep(0.25, 0.9, caa));
  float cAmt = uTune.y * sunVis * exp(-depth * 0.25) * smoothstep(0.05, 0.5, depth) * (1.0 - voidW) * smoothstep(0.0, 0.35, sd) * (1.0 - uNight);
  refr *= 1.0 + caus * cAmt;

  // ---- absorption / depth gradient ----------------------------------------------------
  float dd = 1.0 - exp(-depth * 0.65);
  // open sea: large, slow patches of lighter / deeper water so it doesn't read as a flat tablecloth
  float seaN = w_vnoise(wP.xz * 0.018 + vec2(wt * 0.004, 0.0)) * 0.65 + w_vnoise(wP.xz * 0.045 - vec2(0.0, wt * 0.006)) * 0.35;
  dd = clamp(dd + (seaN - 0.5) * 0.55 * openW * smoothstep(2.5, 7.0, depth), 0.0, 1.0);
  vec3 body = mix(uShallow, uMid, smoothstep(0.0, 0.55, dd));
  body = mix(body, uDeep, smoothstep(0.5, 0.98, dd));
  vec3 bodyLit = body * Ldiff;
  refr = mix(refr, bodyLit, voidW);
  vec3 Tc = exp(-tb * uAbsorb);                                   // chromatic loss of the bed image (red first)
  float S = 1.0 - exp(-tb * mix(0.7, 0.36, openW) * uTune.z);      // in-scatter opacity (ponds murkier than sea)
  vec3 tint = mix(vec3(1.0), uTint, 0.35 + 0.65 * smoothstep(0.0, 1.4, depth));
  vec3 col = mix(refr * tint * Tc, bodyLit, S);

  // ---- fresnel reflection: planar reflection when available, else sky gradient + bank tint --
  vec3 R = reflect(-wV, N);
  float ry = clamp(R.y, 0.0, 1.0);
  vec3 refl = mix(uSkyHorizon, uSkyZenith, pow(ry, 0.6));
  refl = mix(refl, uBank * Ldiff, landNear * 0.45 * (1.0 - uReflOn));
  if (uReflOn > 0.5) {
    vec4 rc = uReflMatrix * vec4(wP.x, uSurfaceY, wP.z, 1.0);
    // wave-distorted: calm ponds mirror crisply, the open sea breaks reflections (clouds) into streaks
    vec2 nd = N.xz * mix(0.02, 0.16, openW) / (1.0 + wViewDist * mix(0.02, 0.006, openW));
    vec2 rUV = rc.xy / rc.w + vec2(nd.x, nd.y * 1.8);
    refl = texture2D(uReflTex, clamp(rUV, vec2(0.001), vec2(0.999))).rgb;
  }
  // calm water: slightly desaturated mirror so mixed foliage / dawn sky don't smear into an oil-slick
  refl = mix(refl, vec3(dot(refl, LUMA)), 0.3 * (1.0 - openW));
  // cap reflection brightness (mirrored HDR sun disc / bright sky would bloom into white slabs)
  float rl = dot(refl, LUMA);
  float rcap = max(dot(uSkyHorizon, LUMA) * mix(0.85, 0.5, uNight), mix(0.3, 0.02, uNight));
  refl *= min(1.0, rcap / max(rl, 1e-4)) * mix(1.0, 0.4, uNight);
  float NdV = clamp(dot(N, wV), 0.0, 1.0);
  float fres = (0.03 + 0.97 * pow(1.0 - NdV, 5.0)) * uTune2.y;
  col = mix(col, refl, clamp(fres, 0.0, mix(0.92, 0.7, uReflOn)));
