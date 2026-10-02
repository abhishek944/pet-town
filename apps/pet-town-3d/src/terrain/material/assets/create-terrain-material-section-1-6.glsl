
gDX = dFdx(vTUv); gDY = dFdy(vTUv);
gSX = dFdx(-vViewPosition); gSY = dFdy(-vViewPosition);
bool isTop = vDir > 1.5 && vDir < 2.5;
bool isSide = vDir < 1.5 || vDir > 3.5;
gTopMix = 0.0;
if (isTop) {
  float nm = tNoise(vWPos.xz * 0.33) * 0.65 + tNoise(vWPos.xz * 0.9 + 17.0) * 0.35;
  gTopMix = smoothstep(0.38, 0.62, nm);
}
vec4 tBase = sampleLayer(vTUv, vTile);
vec3 alb = tBase.rgb;
float hgt = tBase.a;
float overA = 0.0;
float lipShadow = 0.0;
if (vOver < 254.5) {
  vec4 tOver = textureGrad(uAtlas, vec3(vTUv, vOver), gDX, gDY);
  bool lipOv = isLipOverlay();
  if (isSide && lipOv) tOver.a *= smoothstep(0.3, 0.42, vLUv.y);
  alb = mix(alb, tOver.rgb, tOver.a);
  overA = tOver.a;
  if (isSide && lipOv) {
    // the lip overhangs: soft drop shadow just below its wavy edge + ambient darkening under it
    float above = overlayA(vTUv + vec2(0.0, 0.045), vLUv.y + 0.09);
    lipShadow = max(above - overA, 0.0) * 0.55 + smoothstep(0.45, 0.8, vLUv.y) * (1.0 - overA) * 0.16;
  }
}
vec3 col = alb * vTint;
col *= 1.0 - lipShadow;
if (isSide && vEdge < 0.5) {
  // moss hanging from wall tops (amount is a smooth world-space field baked per vertex)
  float mA = vGTint.r * 0.5;
  if (mA > 0.01) {
    vec4 mT = textureGrad(uAtlas, vec3(vTUv, L_MOSS), gDX, gDY);
    vec2 mp = vec2(vWPos.x + vWPos.z, vWPos.y);
    float mn = tNoise(mp * vec2(1.6, 0.35)) * 0.6 + tNoise(mp * vec2(4.1, 0.9) + 3.3) * 0.4;   // vertical drips
    float mm = smoothstep(0.35, 0.8, mA + (mT.a - 0.5) * 0.3 + (mn - 0.5) * 0.42);
    mm *= (1.0 - overA) * mix(1.0, 0.5, max(dot(normalize(vWNrm), uLightDir), 0.0)); // moss prefers shade
    vec3 mossCol = mix(vec3(0.20, 0.30, 0.12), vec3(0.33, 0.45, 0.18), smoothstep(0.2, 0.8, mn)) * (0.9 + 0.2 * mT.a);
    col = mix(col, mossCol, mm * 0.92);
    hgt = mix(hgt, 0.7, mm);
  }
}
if (isSide) col *= 1.0 + 0.07 * overA * smoothstep(0.82, 1.0, vLUv.y); // sunny top of the lip

// block seams: faint on tops; on walls a light upper and dark lower line so stacks read as blocks
vec2 be = min(vLUv, 1.0 - vLUv);
float sl = uSeam * uSeamL[int(vTile + 0.5)];
float seam = 1.0;
if (isTop) seam -= sl * 0.55 * (1.0 - smoothstep(0.0, 0.07, min(be.x, be.y)));
else if (isSide) {
  float bare = 1.0 - overA;
  seam -= sl * 0.25 * (1.0 - smoothstep(0.0, 0.06, vLUv.y));
  seam -= sl * 0.2 * (1.0 - smoothstep(0.0, 0.05, be.x)) * bare;
  // low-frequency colour banding in world y: strata tones flow across block boundaries
  float yb = sin(vWPos.y * 0.9 + tNoise(vWPos.xz * 0.05) * 3.0) * 0.6 + sin(vWPos.y * 2.3 + tNoise(vWPos.xz * 0.11 + 5.0) * 4.0) * 0.4;
  col *= 1.0 + 0.14 * yb * bare;
  // large-scale wall variation (multi-block tone drift across the face)
  col *= mix(1.0, 0.9 + 0.2 * tNoise(vWPos.xz * 0.07 + vWPos.y * 0.05), bare);
}

if (vEdge > 0.5) {
  // grass creeping over the edges of path / sand tops next to same-level grass
  float ef = vEdge; vec2 q = vLUv; float d = 9.0;
  if (mod(ef, 2.0) > 0.5) d = min(d, q.x);
  if (mod(floor(ef / 2.0), 2.0) > 0.5) d = min(d, 1.0 - q.x);
  if (mod(floor(ef / 4.0), 2.0) > 0.5) d = min(d, q.y);
  if (mod(floor(ef / 8.0), 2.0) > 0.5) d = min(d, 1.0 - q.y);
  if (mod(floor(ef / 16.0), 2.0) > 0.5) d = min(d, length(q));
  if (mod(floor(ef / 32.0), 2.0) > 0.5) d = min(d, length(q - vec2(1.0, 0.0)));
  if (mod(floor(ef / 64.0), 2.0) > 0.5) d = min(d, length(q - vec2(0.0, 1.0)));
  if (mod(floor(ef / 128.0), 2.0) > 0.5) d = min(d, length(q - vec2(1.0, 1.0)));
  vec4 gT = sampleLayer(vTUv, 0.0);
  float wob = (gT.a - 0.5) * 0.35 + 0.07 * sin(vWPos.x * 5.3 + vWPos.z * 2.1) * sin(vWPos.z * 4.7 - vWPos.x * 1.3);
  float dd = d + wob;
  float cover = 1.0 - smoothstep(0.13, 0.17, dd);
  float lip = smoothstep(0.12, 0.17, dd) * (1.0 - smoothstep(0.17, 0.3, dd));
  col *= 1.0 - 0.3 * lip - 0.12 * (1.0 - smoothstep(0.1, 0.45, dd)); // contact shade under the tufts / lip
  col = mix(col, gT.rgb * vGTint, cover);
  hgt = mix(hgt, gT.a, cover);
}

// close-range painterly detail: world-space noise, fades out 6..15 units from the camera
{
  float vd = length(vViewPosition);
  float fade = 1.0 - smoothstep(6.0, 15.0, vd);
  if (fade > 0.0) {
    vec2 dp = isTop ? vWPos.xz : (vDir < 1.5 ? vWPos.zy : vWPos.xy);
    float dn = tNoise(dp * 4.0) * 0.6 + tNoise(dp * 9.0 + 3.7) * 0.4;
    col *= 1.0 + uDetail * 2.0 * (dn - 0.5) * fade;
  }
}
// sun-catching rounded rims
col *= 1.0 + uRim * vBevel * max(dot(normalize(vWNrm), uLightDir), 0.0);
// dusk / night: warm earth loses saturation and drifts to cool greys (avoids a maroon/navy quilt)
{
  float lum = dot(col, vec3(0.3, 0.59, 0.11));
  float warmth = clamp((col.r - col.b) / max(lum, 0.02) * 0.9, 0.0, 1.0); // earth/clay >> grass
  col = mix(col, vec3(lum) * vec3(0.88, 0.93, 1.04), uNight * (0.12 + 0.45 * warmth));
}
diffuseColor.rgb *= col * seam;
