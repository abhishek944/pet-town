
uniform float uTime, uAmt;
uniform vec3 uCam, uBox, uSunDir, uWind;
attribute vec4 iSeed;
varying vec2 vUv;
varying float vA;
void main() {
  vec3 drift = uWind * uTime + vec3(sin(uTime * 0.31 + iSeed.w * 6.28), sin(uTime * 0.23 + iSeed.x * 6.28) * 0.6, cos(uTime * 0.27 + iSeed.y * 6.28)) * 0.35;
  vec3 local = mod(iSeed.xyz * uBox + drift - uCam, uBox) - uBox * 0.5;
  vec3 p = uCam + local;
  vec3 toP = p - cameraPosition;
  float d = length(toP);
  float edge = 1.0 - smoothstep(0.3, 0.5, max(abs(local.x) / uBox.x, max(abs(local.y) / uBox.y, abs(local.z) / uBox.z)));
  float nearFade = smoothstep(3.0, 6.0, d);
  float fwd = pow(max(dot(normalize(toP), uSunDir), 0.0), 3.0);  // forward scattering: brighter looking into the sun
  float tw = 0.55 + 0.45 * sin(uTime * (1.5 + iSeed.w * 2.5) + iSeed.x * 40.0);
  vA = uAmt * edge * nearFade * tw * (0.06 + 1.6 * fwd); // mostly visible looking toward the sun
  vec4 mv = viewMatrix * vec4(p, 1.0);
  mv.xy += position.xy * (0.018 + 0.018 * iSeed.w);
  gl_Position = projectionMatrix * mv;
  vUv = position.xy + 0.5;
}
