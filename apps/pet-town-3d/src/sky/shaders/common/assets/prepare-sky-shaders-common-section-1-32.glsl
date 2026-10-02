
uniform int uTM;
uniform float uExposure;
vec3 skySrgbToLin(vec3 c) { c = max(c, 0.0); return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(0.04045, c)); }
vec3 skyInvRRT(vec3 y) {
  vec3 A = 1.0 - 0.983729 * y;
  vec3 B = 0.0245786 - 0.432951 * y;
  vec3 C = -(0.000090537 + 0.238081 * y);
  return (-B + sqrt(max(B * B - 4.0 * A * C, 0.0))) / (2.0 * A);
}
// display sRGB colour -> pre-tonemap linear
vec3 displayToLinear(vec3 disp) {
  vec3 c = skySrgbToLin(disp);
  if (uTM == 1) {
    vec3 v =
