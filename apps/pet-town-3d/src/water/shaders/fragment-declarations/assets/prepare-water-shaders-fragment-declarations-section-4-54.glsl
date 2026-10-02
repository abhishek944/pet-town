
uniform vec3 uSunDir;      // visible sun/moon (glints)
uniform vec3 uLightDir;    // key light used for shading + shadows
uniform vec3 uSunColor;
uniform vec3 uSkyHorizon;
uniform vec3 uSkyZenith;
uniform vec3 uShallow;
uniform vec3 uMid;
uniform vec3 uDeep;
uniform vec3 uTint;
uniform vec3 uFoam;
uniform vec3 uBank;
uniform vec3 uAbsorb;
uniform vec4 uRipples[MAX_RIPPLES];
uniform vec2 uFade;
uniform float uNight;
uniform sampler2D uSceneTex;
uniform float uAlphaOut;
uniform float uSceneDisplay;   // 1: uSceneTex holds tone-mapped sRGB (canvas grab, post off) -> invert
uniform int uSceneTM;          // 0 none, 1 linear, 2 ACES
uniform float uSceneExposure;

vec3 w_srgbToLinear(vec3 c) { return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(0.04045, c)); }
vec3 w_invRRT(vec3 y) {
  y = min(y, vec3(0.985));
  vec3 A = 1.0 - 0.983729 * y, B = 0.0245786 - 0.432951 * y, C = -(0.000090537 + 0.238081 * y);
  return (-B + sqrt(max(B * B - 4.0 * A * C, 0.0))) / (2.0 * A);
}
// display colour from the canvas -> pre-tonemap linear (inverse of three's ACESFilmicToneMapping)
vec3 w_sceneToLinear(vec3 c) {
  if (uSceneDisplay < 0.5) return c;
  c = w_srgbToLinear(clamp(c, 0.0, 1.0));
  if (uSceneTM == 2) {
    const mat3 OUT_INV = mat3(0.643038, 0.059269, 0.005962, 0.311187, 0.931436, 0.063929, 0.045775, 0.009295, 0.930118);
    const mat3 IN_INV = mat3(1.764741, -0.147028, -0.036337, -0.675778, 1.160252, -0.162436, -0.088963, -0.013224, 1.198773);
    c = IN_INV * w_invRRT(max(OUT_INV * c, 0.0));
    return max(c, 0.0) * 0.6 / uSceneExposure;
  }
  if (uSceneTM == 1) return c / uSceneExposure;
  return c;
}   // 0.5 into post's scene target (water marker for SSAO), 1.0 into the canvas
#ifdef USE_TRANSMISSION
  #define W_SCENE transmissionSamplerMap
#else
  #define W_SCENE uSceneTex
  uniform mat4 projectionMatrix;
#endif
uniform sampler2D uReflTex;
uniform mat4 uReflMatrix;
uniform float uReflOn;
uniform vec4 uTune;     // x refraction, y caustics, z clarity (absorption scale), w glitter
uniform vec4 uTune2;    // x foam amount, y reflection amount, z spec amount, w debug mode

vec2 w_hash22(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973)); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.xx + p3.yz) * p3.zy); }

// gradient noise + analytic derivatives (value, d/dx, d/dy)
vec3 w_noised(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  vec2 du = 30.0 * f * f * (f * (f - 2.0) + 1.0);
  vec2 ga = w_hash22(i) * 2.0 - 1.0, gb = w_hash22(i + vec2(1.0, 0.0)) * 2.0 - 1.0;
  vec2 gc = w_hash22(i + vec2(0.0, 1.0)) * 2.0 - 1.0, gd = w_hash22(i + vec2(1.0, 1.0)) * 2.0 - 1.0;
  float va = dot(ga, f), vb = dot(gb, f - vec2(1.0, 0.0)), vc = dot(gc, f - vec2(0.0, 1.0)), vd = dot(gd, f - vec2(1.0, 1.0));
  return vec3(va + u.x * (vb - va) + u.y * (vc - va) + u.x * u.y * (va - vb - vc + vd),
              ga + u.x * (gb - ga) + u.y * (gc - ga) + u.x * u.y * (ga - gb - gc + gd) + du * (u.yx * (va - vb - vc + vd) + vec2(vb, vc) - va));
}

// gradient of 3 rotated / non-harmonic octaves of drifting noise (world-space slope), offset by 'o'
const mat2 W_R1 = mat2(0.7648, -0.6442, 0.6442, 0.7648);   // ~40 deg
const mat2 W_R2 = mat2(-0.4161, -0.9093, 0.9093, -0.4161); // ~115 deg
vec2 w_detail(vec2 p, float t, float lodN) {
  vec2 q1 = p * 0.43 + vec2(t * 0.13, t * 0.09);
  vec2 q2 = W_R1 * p * 1.17 + vec2(-t * 0.21, t * 0.17) + 17.0;
  vec2 q3 = W_R2 * p * 2.71 + vec2(t * 0.31, -t * 0.27) + 41.0;
  vec3 a = w_noised(q1), b = w_noised(q2), c = w_noised(q3);
  return a.yz * 0.43 * 0.12 + (b.yz * W_R1) * 1.17 * 0.05 + (c.yz * W_R2) * 2.71 * 0.013 * lodN;
}

float w_bedExact(vec2 cell) {
  ivec2 t = ivec2(cell - uHeightRect.xy);
  ivec2 sz = ivec2(uHeightRect.zw);
  if (t.x < 0 || t.y < 0 || t.x >= sz.x || t.y >= sz.y) return uSurfaceY - 40.0;
  return texelFetch(uHeightTex, t, 0).r;
}

float w_smin(float a, float b, float k) { float h = max(k - abs(a - b), 0.0) / k; return min(a, b) - h * h * k * 0.25; }

// distance (blocks) to the nearest column poking out of the water (5x5 neighbourhood), smooth-min'd across
// boxes so inner corners round off; y = height of that bank above the water (thin foam on tall banks)
vec2 w_shore(vec2 p) {
  vec2 c = floor(p);
  float d = 2.6, dmin = 2.6, bank = 0.0;
  for (int j = -2; j <= 2; j++) for (int i = -2; i <= 2; i++) {
    vec2 cc = c + vec2(float(i), float(j));
    float hb = w_bedExact(cc);
    if (hb > uSurfaceY) {
      vec2 q = abs(p - (cc + 0.5)) - 0.5;
      float bd = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);
      d = w_smin(d, bd, 0.3);   // mild: smin over a 5x5 union accumulates, the rounding comes from sdF below
      if (bd < dmin) { dmin = bd; bank = hb - uSurfaceY; }
    }
  }
  return vec2(max(d, 0.0), bank);
}

// animated voronoi: distance to the nearest cell border (F2 - F1), 0 on the border
float w_voroEdge(vec2 p, float t) {
  vec2 n = floor(p), f = fract(p);
  float f1 = 8.0, f2 = 8.0;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 g = vec2(float(i), float(j));
    vec2 o = w_hash22(n + g);
    o = 0.5 + 0.4 * sin(t + 6.2831 * o);
    vec2 r = g + o - f;
    float d = dot(r, r);
    if (d < f1) { f2 = f1; f1 = d; } else if (d < f2) { f2 = d; }
  }
  return sqrt(f2) - sqrt(f1);
}

// stylised caustic web: two drifting, domain-warped voronoi border networks, bright where they cross
float w_caustic(vec2 p, float t, float aa) {
  vec2 warp = vec2(w_vnoise(p * 0.33 + t * 0.06), w_vnoise(p * 0.33 + 7.3 - t * 0.05)) - 0.5;
  p += warp * 1.2;
  float e1 = w_voroEdge(p, t * 0.9);
  float e2 = w_voroEdge(p * 1.31 + vec2(3.1, 1.7), -t * 0.8 + 2.0);
  float w = 0.075 + aa;
  float l1 = exp(-e1 * e1 / (w * w));
  float l2 = exp(-e2 * e2 / (w * w * 1.4));
  float patchy = 0.45 + 0.55 * smoothstep(0.2, 0.8, w_vnoise(p * 0.21 - t * 0.03));
  return (l1 * 0.55 + l2 * 0.35 + l1 * l2 * 1.6) * patchy;
}

// sparse sun glints: ~15% of cells hold a facet that flashes when it mirrors the sun into the eye;
// only the brightest ~5% get little star arms. (Caller gates this to the reflected-sun path.)
float w_glints(vec2 p, vec3 H, float t, float scale) {
  vec2 gp = p * scale;
  vec2 id = floor(gp), f = fract(gp);
  vec2 rnd = w_hash22(id);
  float keep = step(0.85, rnd.x);
  vec2 c = 0.25 + 0.5 * w_hash22(id + 3.17);
  vec2 tilt = (w_hash22(id + 7.31) - 0.5) * 0.9;
  vec3 fn = normalize(vec3(tilt.x, 1.0, tilt.y));
  float lobe = pow(max(dot(fn, H), 0.0), 40.0);
  float tw = pow(0.5 + 0.5 * sin(t * (1.7 + rnd.y * 3.5) + rnd.x * 40.0), 8.0);
  float px = max(fwidth(gp.x), fwidth(gp.y));
  vec2 dv = f - c;
  float core = 1.0 - smoothstep(0.0, 0.03 + min(px * 1.2, 0.08), length(dv));
  float arm = 0.01 + min(px * 0.8, 0.05);
  float crs = (1.0 - smoothstep(0.0, arm, abs(dv.x))) * (1.0 - smoothstep(0.0, 0.14, abs(dv.y)))
            + (1.0 - smoothstep(0.0, arm, abs(dv.y))) * (1.0 - smoothstep(0.0, 0.14, abs(dv.x)));
  float star = step(0.95, rnd.y);
  float farFade = 1.0 - smoothstep(0.06, 0.3, px);
  return (core + crs * 0.5 * star) * tw * keep * lobe * farFade;
}
