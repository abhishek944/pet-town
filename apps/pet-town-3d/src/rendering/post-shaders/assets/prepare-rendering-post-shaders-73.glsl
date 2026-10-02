
precision highp float;
uniform sampler2D tDiffuse;
uniform vec2 uRes;
uniform float uTime;
uniform vec3 uWB, uLift, uGamma, uGain, uShadowTint, uHighTint, uVigColor;
uniform float uSat, uVibrance, uContrast, uVignette, uGrain, uGradeAmt, uChromaKnee, uChromaSlope, uGreenAmt, uMagentaCut;
#include <tonemapping_pars_fragment>
#include <colorspace_pars_fragment>
varying vec2 vUv;
float luma(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }
float ign(vec2 p) { return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))); }
float hash12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
vec3 rgb2hsv(vec3 c) {
  vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
  vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
  vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
  float d = q.x - min(q.w, q.y), e = 1.0e-10;
  return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}
vec3 hsv2rgb(vec3 c) {
  vec3 p = abs(fract(c.xxx + vec3(1.0, 2.0 / 3.0, 1.0 / 3.0)) * 6.0 - 3.0);
  return c.z * mix(vec3(1.0), clamp(p - 1.0, 0.0, 1.0), c.y);
}
void main() {
  vec4 src = texture2D(tDiffuse, vUv);
  vec3 c = src.rgb * mix(vec3(1.0), uWB, uGradeAmt);
  #ifdef LINEAR_TONE_MAPPING
    c = LinearToneMapping(c);
  #elif defined( REINHARD_TONE_MAPPING )
    c = ReinhardToneMapping(c);
  #elif defined( CINEON_TONE_MAPPING )
    c = CineonToneMapping(c);
  #elif defined( ACES_FILMIC_TONE_MAPPING )
    c = ACESFilmicToneMapping(c);
  #elif defined( AGX_TONE_MAPPING )
    c = AgXToneMapping(c);
  #elif defined( NEUTRAL_TONE_MAPPING )
    c = NeutralToneMapping(c);
  #elif defined( CUSTOM_TONE_MAPPING )
    c = CustomToneMapping(c);
  #endif
  #ifdef SRGB_TRANSFER
    c = sRGBTransferOETF(vec4(c, 1.0)).rgb;
  #endif
  c = clamp(c, 0.0, 1.0);
  vec3 g = c;
  float L = luma(g);
  float skyKeep = 1.0 - clamp((g.b - g.r) * 4.0, 0.0, 1.0); // blue skies keep their hue (no mint cast)
  g += uShadowTint * (1.0 - smoothstep(0.0, 0.55, L)) + uHighTint * smoothstep(0.45, 1.0, L) * skyKeep;
  g = g * uGain + uLift * (1.0 - g);
  g = pow(max(g, 0.0), 1.0 / uGamma);
  g = mix(g, g * g * (3.0 - 2.0 * g), uContrast);
  L = luma(g);
  float chroma = max(g.r, max(g.g, g.b)) - min(g.r, min(g.g, g.b));
  g = mix(vec3(L), g, uSat * (1.0 + uVibrance * (1.0 - chroma)));
  // green-targeted: hues 70..130deg rotate ~8deg toward emerald and lose ~10% saturation (anti-lime)
  vec3 hsv = rgb2hsv(max(g, 0.0));
  float gw = smoothstep(55.0 / 360.0, 75.0 / 360.0, hsv.x) * (1.0 - smoothstep(125.0 / 360.0, 145.0 / 360.0, hsv.x)) * uGreenAmt;
  hsv.x += gw * (3.0 / 360.0); hsv.y *= 1.0 - 0.1 * gw;
  // magenta cut (dusk/night): desaturate hues 285..345deg so pink light doesn't clash with teal shadows
  float mw = smoothstep(270.0 / 360.0, 290.0 / 360.0, hsv.x) * (1.0 - smoothstep(340.0 / 360.0, 355.0 / 360.0, hsv.x));
  hsv.y *= 1.0 - uMagentaCut * mw;
  g = hsv2rgb(hsv);
  L = luma(g);
  // chroma knee: tames neon (pure lime greens, hot oranges) into pastel-friendly colour, pastels untouched
  chroma = max(g.r, max(g.g, g.b)) - min(g.r, min(g.g, g.b));
  if (chroma > uChromaKnee) g = mix(vec3(L), g, (uChromaKnee + (chroma - uChromaKnee) * uChromaSlope) / chroma);
  // hue-preserving highlight shoulder: gain/white-balance/tints push the brightest channel past 1.0; a hard
  // per-channel clip there turns warm sky gradients into a flat pink plateau with a visible ring around the sun
  float gm = max(g.r, max(g.g, g.b));
  if (gm > 0.88) g *= (0.88 + 0.12 * (1.0 - exp(-1.6 * (gm - 0.88) / 0.12))) / gm; // 1.0 -> 0.976, 1.1 -> 0.994
  c = mix(c, g, uGradeAmt);

  vec2 q = (vUv - 0.5) * vec2(uRes.x / uRes.y, 1.0);
  float r = length(q) / length(vec2(uRes.x / uRes.y, 1.0) * 0.5);
  float v = smoothstep(0.42, 1.05, r);
  c *= mix(vec3(1.0), uVigColor, v * v * uVignette);

  if (uGrain > 0.0) {
    float n = hash12(gl_FragCoord.xy + fract(uTime * 7.31) * 437.0) - 0.5;
    c += n * uGrain * (1.0 - 0.7 * luma(c));
  }
  c += (ign(gl_FragCoord.xy) - 0.5) / 255.0; // dither: kills sky banding
  gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
}
