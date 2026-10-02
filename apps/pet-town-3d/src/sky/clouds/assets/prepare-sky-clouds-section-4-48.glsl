
uniform vec3 uCloudL;      // light direction (sun, or moon at night)
uniform vec3 uLit, uShade; // display colours
uniform vec3 uRimLin;      // linear HDR silver lining
uniform float uVis;        // aerial visibility distance
uniform float uTime;
uniform float uCloudAlpha;
uniform float uDensity;
uniform vec3 uUnder;       // display: warm underside glow near sunset
uniform float uUnderK;
varying vec2 vUv;
varying vec3 vPuffC;
varying float vR;
varying vec3 vCloudC;
varying vec3 vExt;
varying float vFade;
varying float vSeed;
varying vec3 vBillW;
void main() {
  float r2 = dot(vUv, vUv);
  if (r2 >= 1.0) discard;
  float rr = sqrt(r2);

  // soft, slowly billowing edge
  float n1 = skyNoise2(vUv * 2.4 + vSeed * 31.0 + vec2(uTime * 0.021, -uTime * 0.017));
  float n2 = skyNoise2(vUv * 5.3 + vSeed * 17.0 - vec2(uTime * 0.034, uTime * 0.026));
  float re = rr + (n1 - 0.5) * 0.30 + (n2 - 0.5) * 0.13;
  float a = (1.0 - smoothstep(0.66, 0.85, re)) * (1.0 - smoothstep(0.88, 1.0, rr));
  // flat cumulus base
  a *= smoothstep(vCloudC.y - 0.18 * vExt.y, vCloudC.y + 0.3 * vExt.y, vBillW.y);
  a *= vFade * uCloudAlpha;
  // near the sun, edges go fully opaque so a cloud never cuts the sun disc into a crescent
  vec3 Vb = normalize(vBillW - cameraPosition);
  a = mix(a, smoothstep(0.0, 0.35, a), pow(max(dot(Vb, uSunDir), 0.0), 64.0));
  if (a < 0.004) discard;

  vec3 nV = vec3(vUv, sqrt(1.0 - r2));
  vec3 nW = normalize(nV * mat3(viewMatrix));
  vec3 P = vPuffC + nW * vR * 0.8;
  vec3 L = normalize(uCloudL);

  // volumetric-ish: optical depth toward the light through the cluster ellipsoid (Beer-Lambert)
  vec3 eC = vCloudC + vec3(0.0, vExt.y * 0.42, 0.0);
  vec3 eR = vec3(vExt.x * 1.08, vExt.y * 0.78, vExt.z * 1.08);
  vec3 q = (P - eC) / eR;
  vec3 Le = normalize(L / eR);
  float b = dot(q, Le), c = dot(q, q) - 1.0;
  float disc = b * b - c;
  float sq = sqrt(max(disc, 0.0));
  float path = disc > 0.0 ? max((-b + sq) - max(-b - sq, 0.0), 0.0) : 0.0;
  float trans = exp(-path * uDensity);
  // puff-scale relief so it still reads as soft cotton balls
  float relief = 0.85 + 0.15 * clamp(dot(nW, L) * 0.5 + 0.5, 0.0, 1.0);
  // height measured on the billboard plane: continuous across overlapping puffs (no horizontal slicing)
  float hgt = clamp((mix(P.y, vBillW.y, 0.75) - vCloudC.y) / (vExt.y * 1.5), 0.0, 1.0);
  float ao = mix(0.5, 1.0, smoothstep(0.0, 0.75, hgt));        // darker, denser underside
  float light = clamp(trans * relief * ao, 0.0, 1.0);
  // storybook: gently banded light ramp
  float band = smoothstep(0.28, 0.6, light);
  light = mix(light, band, 0.3);
  // top faces pick up a little sky ambient so shade isn't flat
  float skyAmb = smoothstep(-0.2, 0.9, nW.y) * 0.18;
  vec3 disp = mix(uShade, uLit, clamp(light + skyAmb * (1.0 - light), 0.0, 1.0));
  // sunset: undersides catch light scattered from the glowing horizon (stronger toward the sun)
  if (uUnderK > 0.001) {
    vec3 Vc = normalize(vBillW - cameraPosition);
    vec2 sh = normalize(uSunDir.xz + 1e-5), vh = normalize(Vc.xz + 1e-5);
    float toward = pow(clamp(dot(sh, vh) * 0.5 + 0.5, 0.0, 1.0), 2.0);
    float underW = 1.0 - smoothstep(-0.05, 0.7, hgt);
    disp = mix(disp, uUnder, clamp(underW * uUnderK * (0.3 + 0.7 * toward) * (1.0 - light * 0.5), 0.0, 1.0));
  }

  // aerial perspective into the sky gradient
  vec3 toP = vBillW - cameraPosition;
  float dist = length(toP);
  vec3 V = toP / dist;
  float haze = 1.0 - exp(-dist / uVis);
  haze = clamp(haze * 0.9 + (1.0 - smoothstep(0.0, 0.07, V.y)) * 0.3, 0.0, 0.94);
  disp = mix(disp, skyGradient(V), haze);

  vec3 col = displayToLinear(disp);
  // sun-side in-scatter like the sky (keeps horizon clouds consistent with sky/fog)
  col += uScatterLin * skyScatterPhase(dot(V, uSunDir)) * pow(1.0 - clamp(V.y, 0.0, 1.0), 4.0) * haze;
  // silver lining: only the thin outer fringe of the cluster glows when looking toward the light
  float fwd = pow(max(dot(V, L), 0.0), 4.0);
  // outline of the whole cloud (not per puff) so silver linings never draw arcs/crescents inside it
  float radial = length((vBillW - eC) / eR);
  float fringe = smoothstep(0.7, 1.0, radial);
  float thin = fringe * trans + trans * 0.25;
  col += uRimLin * fwd * thin * 0.7 * (1.0 - haze * 0.7);
  // forward-scatter glow when the light source sits behind the cloud
  col += uRimLin * pow(max(dot(V, L), 0.0), 24.0) * 1.5 * mix(0.35, 1.0, fringe) * (1.0 - haze * 0.7);

  gl_FragColor = vec4(max(col, 0.0), a);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
