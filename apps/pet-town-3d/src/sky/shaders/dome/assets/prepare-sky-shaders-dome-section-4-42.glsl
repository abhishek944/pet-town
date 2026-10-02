
uniform vec3 uMoonDir;
uniform vec3 uSunDisc;     // linear HDR
uniform vec3 uGlow;        // linear HDR corona tint
uniform vec3 uCirrus;      // display colour
uniform float uCirrusA;
uniform float uNight;      // 0..1 star/moon/milkyway visibility
uniform float uTime;
uniform float uSunSize;    // angular radius (rad)
uniform float uMoonSize;
uniform mat3 uStarRot;
uniform vec3 uMoonLight;   // moon-local light dir (phase)
uniform vec3 uLit, uShade; // cloud display colours (shared with clouds)
uniform float uAltA;       // altocumulus opacity
varying vec3 vDir;

vec3 moonColor(vec3 d, out float cover, out float litA) {
  cover = 0.0; litA = 0.0;
  vec3 m = normalize(uMoonDir);
  float cosA = dot(d, m);
  if (cosA < cos(uMoonSize * 1.4)) return vec3(0.0);
  vec3 up = abs(m.y) > 0.99 ? vec3(1, 0, 0) : vec3(0, 1, 0);
  vec3 R = normalize(cross(up, m)); vec3 U = cross(m, R);
  vec2 p = vec2(dot(d, R), dot(d, U)) / sin(uMoonSize);
  float r = length(p);
  cover = 1.0 - smoothstep(0.96, 1.0, r);
  if (cover <= 0.0) return vec3(0.0);
  vec3 n = vec3(p, sqrt(max(1.0 - r * r, 0.0)));
  float lit = smoothstep(-0.06, 0.16, dot(n, uMoonLight));
  float maria = skyFbm2(p * 1.9 + 4.0);
  float craters = smoothstep(0.58, 0.8, skyNoise2(p * 6.5 + 1.7)) * 0.14 + smoothstep(0.6, 0.85, skyNoise2(p * 13.0 + 7.3)) * 0.08;
  float albedo = 1.0 - smoothstep(0.4, 0.62, maria) * 0.34 - craters;
  float limb = mix(0.78, 1.0, pow(n.z, 0.6));
  vec3 lightSide = vec3(1.0, 0.93, 0.78) * albedo * limb;
  litA = lit;
  return lightSide * 1.1;
}

float shootingStar(vec3 d, float night) {
  if (night < 0.2) return 0.0;
  float period = 9.0;
  float id = floor(uTime / period);
  float tt = fract(uTime / period) * period;
  float dur = 0.9;
  if (tt > dur) return 0.0;
  float h1 = fract(sin(id * 12.9898) * 43758.5453), h2 = fract(sin(id * 78.233) * 12543.123), h3 = fract(sin(id * 3.17) * 9123.77);
  float az = h1 * 6.2831, el = 0.45 + h2 * 0.5;
  vec3 s0 = normalize(vec3(cos(az) * cos(el), sin(el), sin(az) * cos(el)));
  vec3 tang = normalize(cross(s0, vec3(0.2 + h3, 1.0, 0.1)));
  tang = normalize(tang - vec3(0.0, 0.6, 0.0)); // heads downward
  float prog = tt / dur;
  float len = 0.22;
  vec3 head = normalize(s0 + tang * prog * 0.5);
  vec3 tail = normalize(s0 + tang * (prog * 0.5 - len * min(prog * 3.0, 1.0)));
  // distance from d to arc segment (small-angle, planar approx)
  vec3 ab = head - tail; vec3 ap = d - tail;
  float k = clamp(dot(ap, ab) / max(dot(ab, ab), 1e-6), 0.0, 1.0);
  float dist = length(ap - ab * k);
  float w = 0.0012 + 0.0015 * k;
  float line = smoothstep(w, 0.0, dist) * k * k;
  float fade = smoothstep(0.0, 0.15, prog) * (1.0 - smoothstep(0.7, 1.0, prog));
  return line * fade * night;
}

void main() {
  vec3 d = normalize(vDir);
  float h = d.y;
  vec3 sunD = normalize(uSunDir);
  float mu = dot(d, sunD);

  // --- base gradient (display) + cirrus (display)
  vec3 disp = skyGradient(d);
  if (uCirrusA > 0.001 && h > 0.0) {
    vec2 cuv = d.xz / (h + 0.12);
    mat2 rot = mat2(0.866, 0.5, -0.5, 0.866);
    vec2 q = rot * cuv * 0.55 + vec2(uTime * 0.004, uTime * 0.0015);
    float warp = skyFbm2(q * 0.7 + 3.1);
    float n = skyFbm2(vec2(q.x * 0.9, q.y * 3.2) + warp * 1.6);
    float cir = smoothstep(0.52, 0.86, n) * smoothstep(0.03, 0.3, h) * (1.0 - smoothstep(0.45, 0.9, h) * 0.85);
    float sunLift = 1.0 + skyScatterPhase(mu) * 0.8;
    disp = mix(disp, uCirrus * min(sunLift, 1.25), clamp(cir * uCirrusA * sunLift, 0.0, 0.85));
  }

  // --- altocumulus: patches of soft, irregular cloudlets on a high plane ("mackerel sky")
  if (uAltA > 0.001 && h > 0.14) {
    vec2 auv = d.xz / (h + 0.04) * 6.0 + vec2(uTime * 0.02, uTime * 0.008);
    float cov = smoothstep(0.6, 0.8, skyFbm2(auv * 0.09 + 13.0));
    if (cov > 0.001) {
      vec2 w = vec2(skyNoise2(auv * 0.7 + 3.1), skyNoise2(auv * 0.7 + 9.7)) - 0.5;
      vec2 q = auv + w * 0.9;
      vec2 cell = floor(q), f = fract(q);
      float dens = 0.0, core = 0.0;
      for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
        vec2 g = vec2(float(i), float(j));
        vec2 id = cell + g;
        vec2 o = vec2(skyHash12(id), skyHash12(id + 19.1)) * 0.85 + 0.075;
        float r = (0.34 + 0.3 * skyHash12(id + 7.3)) * (0.55 + 0.45 * cov);
        vec2 dv = g + o - f;
        float dd = length(dv * vec2(1.0, 2.2));
        float blob = 1.0 - smoothstep(r * 0.3, r * 1.4, dd);
        dens += blob;
        core = max(core, blob * clamp(0.6 + dot(dv, normalize(uSunDir.xz + 1e-4)) * 0.9, 0.0, 1.0));
      }
      dens = clamp(dens, 0.0, 1.0) * cov;
      dens *= 0.75 + 0.5 * skyNoise2(auv * 2.3);            // fluffy breakup
      float altA = smoothstep(0.05, 0.95, dens) * smoothstep(0.14, 0.4, h) * uAltA;
      vec3 altCol = mix(mix(uShade, uLit, 0.45 + 0.55 * core), uCirrus, 0.2);
      disp = mix(disp, altCol, clamp(altA, 0.0, 0.35));
    }
  }

  vec3 col = displayToLinear(disp);

  // --- sun-side lift of the lower sky, fading upward (linear, same lobe as fog)
  float lowW = pow(1.0 - clamp(h, 0.0, 1.0), 4.0);
  col += uScatterLin * skyScatterPhase(mu) * lowW;

  // --- fog-matched horizon haze band (below/at horizon == fog colour exactly)
  vec3 haze = skyHaze(d);
  float hb = 1.0 - smoothstep(-0.015, 0.06, h);
  col = mix(col, haze, hb);
  // soft deepening further below the horizon (reads as distant sea haze)
  col *= mix(1.0, 0.9, smoothstep(0.0, -0.5, h));

  // --- night sky: milky way
  if (uNight > 0.01) {
    vec3 sd = uStarRot * d;
    vec3 bandN = normalize(vec3(0.35, 0.25, 0.9));
    float bd = dot(sd, bandN);
    float band = exp(-bd * bd * 22.0);
    float cl = skyFbm3(sd * 5.0);
    float dust = smoothstep(0.35, 0.75, skyFbm3(sd * 11.0 + 2.0));
    float mw = band * (0.35 + 0.9 * cl) * (1.0 - dust * 0.55 * band);
    vec3 mwCol = mix(vec3(0.20, 0.16, 0.42), vec3(0.42, 0.30, 0.52), cl);
    col += mwCol * mw * 0.28 * uNight * smoothstep(0.0, 0.3, h);
    col += vec3(0.9, 0.85, 1.0) * shootingStar(d, uNight) * 3.0;
  }

  // --- sun disc + corona (HDR; hidden below horizon)
  float horizonCut = smoothstep(-0.012, 0.004, h);
  float cosS = cos(uSunSize);
  float disc = smoothstep(cosS - 0.0015, cosS + 0.0004, mu);
  float x = max(mu, 0.0);
  // inner corona is near-white warm (no orange-over-lavender = pink ring); the wide lobe stays soft & faint
  float inner = pow(x, 2400.0) * 5.0 + pow(x, 260.0) * 0.7 + pow(x, 60.0) * 0.16;
  float outer = pow(x, 14.0) * 0.1 + pow(x, 5.0) * 0.05;
  float gMax = max(uGlow.r, max(uGlow.g, uGlow.b));
  vec3 glowW = mix(uGlow, gMax * vec3(1.0, 0.94, 0.8), 0.55);
  col += (glowW * inner + uGlow * outer) * mix(0.45, 1.0, horizonCut);
  col += uSunDisc * disc * horizonCut;

  // --- moon (halo first, disc composited over it so the unlit limb stays dark)
  if (uNight > 0.01) {
    float cover, litA;
    vec3 mc = moonColor(d, cover, litA);
    float mh = smoothstep(-0.01, 0.02, h);
    float mm = max(dot(d, normalize(uMoonDir)), 0.0);
    col += vec3(0.55, 0.62, 0.95) * (pow(mm, 700.0) * 0.3 + pow(mm, 80.0) * 0.12 + pow(mm, 12.0) * 0.045) * uNight * mh;
    // unlit limb: occludes the halo and, deep at night, shows faint earthshine; invisible at dusk
    vec3 earth = mix(col, vec3(0.06, 0.085, 0.2), 0.55);
    col = mix(col, earth, cover * (1.0 - litA) * smoothstep(0.5, 1.0, uNight) * mh);
    col = mix(col, mc, cover * litA * min(uNight * 1.6, 1.0) * mh);
  }

  // relative dither to kill gradient banding
  float dn = skyHash12(gl_FragCoord.xy + fract(uTime) * 61.0) - 0.5;
  col *= 1.0 + dn * (2.2 / 255.0);
  col = max(col, 0.0);

  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
