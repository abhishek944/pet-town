
uniform sampler2D tScene, tAO, tBlur1, tBlur2, tShafts;
uniform vec2 uRes, uAORes;
uniform vec3 uShaftColor;
uniform float uMist, uMistCap;
uniform float uUseAO, uUseDOF, uSharpen, uTime;
uniform vec3 uHazeColor, uSunDirW; uniform float uHazeAmt, uHazeStart, uHazeEnd, uHazeCool;
uniform float uUnder, uWaterY; uniform vec3 uWaterColor, uWaterDeep;
uniform mat4 uProjInv, uCamWorld;

// "water turbulence" caustics (after joltz0r), tiles every 1 unit of p
float caustics(vec2 p0, float t) {
  vec2 p = mod(p0 * 6.28318, 6.28318) - 250.0;
  vec2 i = p; float c = 1.0; const float inten = 0.005;
  for (int n = 0; n < 4; n++) {
    float tt = t * (1.0 - (3.5 / float(n + 1)));
    i = p + vec2(cos(tt - i.x) + sin(tt + i.y), sin(tt - i.y) + cos(tt + i.x));
    c += 1.0 / length(vec2(p.x / (sin(i.x + tt) / inten), p.y / (cos(i.y + tt) / inten)));
  }
  c /= 4.0; c = 1.17 - pow(c, 1.4);
  return pow(abs(c), 8.0);
}
uniform int uDebug;
varying vec2 vUv;

float upAO(vec2 uv, float z) {
  vec2 p = uv * uAORes - 0.5; vec2 f = fract(p); vec2 t = 1.0 / uAORes; vec2 b = (floor(p) + 0.5) * t;
  vec4 a = texture2D(tAO, b), bb = texture2D(tAO, b + vec2(t.x, 0.0)), c = texture2D(tAO, b + vec2(0.0, t.y)), d = texture2D(tAO, b + t);
  vec4 w = vec4((1.0 - f.x) * (1.0 - f.y), f.x * (1.0 - f.y), (1.0 - f.x) * f.y, f.x * f.y);
  float tol = 1.0 / (z * 0.04 + 0.03);
  w *= 1.0 / (1.0 + 16.0 * vec4(abs(a.g - z), abs(bb.g - z), abs(c.g - z), abs(d.g - z)) * tol) + 1e-4;
  return dot(w, vec4(a.r, bb.r, c.r, d.r)) / dot(w, vec4(1.0));
}

void main() {
  vec2 uv = vUv;
  // per-pixel underwater mask: probe a point just in front of the lens against a wobbling surface,
  // so a half-submerged camera gets a proper waterline
  float under = 0.0;
  vec3 rayV = vec3(0.0);
  if (uUnder > 0.001) {
    vec4 nv = uProjInv * vec4(vUv * 2.0 - 1.0, -1.0, 1.0);
    rayV = normalize(nv.xyz / nv.w);
    vec3 probe = (uCamWorld * vec4(rayV * 0.15, 1.0)).xyz;
    float wy = uWaterY + 0.02 * sin(probe.x * 5.0 + uTime * 1.9) + 0.015 * sin(probe.z * 7.0 - uTime * 1.4);
    under = uUnder * smoothstep(wy + 0.012, wy - 0.012, probe.y);
    uv += under * vec2(sin(uv.y * 38.0 + uTime * 2.1) + sin(uv.y * 17.0 - uTime * 1.3),
                       cos(uv.x * 29.0 + uTime * 1.7)) * 0.0018;
  }
  float z = viewZAt(uv);
  vec4 scene4 = texture2D(tScene, uv);
  vec3 col = sanitize(scene4.rgb);
  float coc = uUseDOF > 0.5 ? cocAt(uv, z) : 0.0;

  {
    vec2 t = 1.0 / uRes;
    vec3 rn = texture2D(tScene, uv + vec2(t.x, 0.0)).rgb, rs = texture2D(tScene, uv - vec2(t.x, 0.0)).rgb;
    vec3 re = texture2D(tScene, uv + vec2(0.0, t.y)).rgb, rw = texture2D(tScene, uv - vec2(0.0, t.y)).rgb;
    vec3 n = sanitize(rn), s = sanitize(rs), e = sanitize(re), w = sanitize(rw);
    vec3 mn = min(min(n, s), min(e, w)), mx = max(max(n, s), max(e, w));
    // Specular-aliasing firefly filter. Glossy/rim materials can emit absurd HDR values (measured ~50..1400)
    // on sub-pixel silhouettes; the HDR MSAA resolve keeps them as white dots (a direct LDR render clamps each
    // sample before resolving, hiding them). A pixel > 6 that is > 4x its second-darkest neighbour is such a
    // spike (thin rim lines included), so it takes the average of its two darkest neighbours.
    // Real bright areas (sun disc, lamps, windows) have bright neighbours and are untouched.
    float lc = luma(min(scene4.rgb, vec3(65000.0)));
    vec4 L4 = vec4(luma(n), luma(s), luma(e), luma(w));
    vec2 lo = min(L4.xy, L4.zw), hi = max(L4.xy, L4.zw);
    float lo1 = min(lo.x, lo.y), lo2 = min(max(lo.x, lo.y), min(hi.x, hi.y)); // darkest, 2nd darkest
    if (lc > 6.0 && lc > 4.0 * lo2) {
      vec3 dark = L4.x <= lo2 ? n : (L4.y <= lo2 ? s : (L4.z <= lo2 ? e : w));
      col = 0.5 * (mn + min(dark, mx));
    } else if (luma(col) > 1.0 && luma(col) > 2.5 * luma(mx)) col = mx * 1.25;
    if (uSharpen > 0.0) {
      vec3 sh = col + (col - 0.25 * (n + s + e + w)) * uSharpen * (1.0 - coc);
      col = clamp(sh, min(col, mn), max(col, mx));
    }
  }

  float ao = 1.0;
  if (uUseAO > 0.5) { ao = mix(1.0, upAO(uv, z), aoMask(scene4.a)); col = applyAO(col, ao); }

  if (coc > 0.002) {
    vec4 b1 = texture2D(tBlur1, uv); b1.rgb /= max(b1.a, 1e-5);
    vec4 b2 = texture2D(tBlur2, uv); b2.rgb /= max(b2.a, 1e-5);
    col = mix(col, b1.rgb, smoothstep(0.0, 0.45, coc));
    col = mix(col, b2.rgb, smoothstep(0.4, 1.0, coc));
  }
  // dreamy "lighten" mist: the heavy blur only ever brightens. The lift is capped relative to the pixel itself
  // (per channel, at most +uMistCap), so mid/light tones pick up a soft glow while dark silhouettes against
  // bright sky/sea don't get a blue halo (a dark canopy can only be lifted by a fraction of its own colour).
  // Depth weighting keeps the effect mostly on the middle/far field.
  if (uMist > 0.0) {
    vec4 m = texture2D(tBlur2, uv);
    vec3 mb = m.rgb / max(m.a, 1e-5);
    vec3 lit = max(col, min(mb, col * (1.0 + uMistCap)));
    float dw = 0.45 + 0.55 * smoothstep(uFocusDist * 0.7, uFocusDist * 2.5, z);
    col = mix(col, lit, uMist * dw);
  }

  // sun shafts (screen-space, from the bright sky around the sun)
  if (uShaftColor.r + uShaftColor.g + uShaftColor.b > 0.001) col += texture2D(tShafts, uv).rgb * uShaftColor;

  // aerial perspective: distant terrain melts softly into the sky tone. Toward the anti-sun side (where the
  // sky itself is cool) the haze colour is desaturated and cooled so dusk doesn't become one salmon veil.
  float hz = smoothstep(uHazeStart, uHazeEnd, z) * uHazeAmt;
  if (hz > 0.001) {
    vec3 hc = uHazeColor;
    if (uHazeCool > 0.0) {
      vec4 nv = uProjInv * vec4(vUv * 2.0 - 1.0, -1.0, 1.0);
      vec3 rd = (uCamWorld * vec4(normalize(nv.xyz / nv.w), 0.0)).xyz;
      float sAlign = dot(normalize(rd.xz + 1e-5), normalize(uSunDirW.xz + 1e-5));
      float anti = smoothstep(0.3, -0.6, sAlign) * uHazeCool;
      hc = mix(hc, vec3(luma(hc)) * vec3(0.84, 0.9, 1.1), anti);
    }
    col = mix(col, hc, hz * step(z, cameraFar * 0.98));
  }

  if (under > 0.001) {
    // world position of the surface we see (for caustics)
    float zz = min(z, 400.0);
    vec3 wp = (uCamWorld * vec4(rayV * (zz / max(-rayV.z, 1e-3)), 1.0)).xyz;
    float below = uWaterY - wp.y;
    float caus = below > 0.0 ? caustics(wp.xz * 0.22, uTime * 0.55) * exp(-below * 0.22) : 0.0;
    vec3 absorb = exp(-z * vec3(0.16, 0.05, 0.035));
    vec3 uw = col * absorb * vec3(0.75, 1.0, 1.05);
    uw += col * caus * 1.6 * absorb.g + vec3(0.6, 0.9, 1.0) * caus * 0.12 * absorb.g;
    float fogF = 1.0 - exp(-z * 0.075);
    vec3 fogC = mix(uWaterColor, uWaterDeep, clamp(uv.y * -1.0 + 0.9, 0.0, 1.0));
    uw = mix(uw, fogC, fogF);
    // soft god rays slanting down from the surface
    float rx = uv.x * 6.0 + (uv.y - 1.0) * (uv.x - 0.5) * 2.5;
    float rays = pow(0.5 + 0.5 * sin(rx + uTime * 0.35) * sin(rx * 2.3 - uTime * 0.21 + 1.3), 4.0);
    uw += uWaterColor * 1.6 * rays * smoothstep(0.15, 1.0, uv.y) * (0.35 + 0.65 * fogF);
    uw *= 1.0 + 0.2 * smoothstep(0.55, 1.0, uv.y);
    col = mix(col, uw, under);
  }

  if (uDebug == 1) col = vec3(ao);
  else if (uDebug == 2) col = mix(vec3(0.1, 0.5, 0.1), vec3(1.0, 0.2, 0.6), coc);
  else if (uDebug == 3) col = vec3(fract(z / 10.0));
  gl_FragColor = vec4(col, 1.0);
}
