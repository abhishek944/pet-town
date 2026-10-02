
float skyHash12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float skyHash13(vec3 p3) { p3 = fract(p3 * 0.1031); p3 += dot(p3, p3.zyx + 31.32); return fract((p3.x + p3.y) * p3.z); }
float skyNoise2(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(skyHash12(i), skyHash12(i + vec2(1, 0)), u.x), mix(skyHash12(i + vec2(0, 1)), skyHash12(i + vec2(1, 1)), u.x), u.y);
}
float skyNoise3(vec3 p) {
  vec3 i = floor(p), f = fract(p);
  vec3 u = f * f * (3.0 - 2.0 * f);
  float a = mix(mix(skyHash13(i), skyHash13(i + vec3(1, 0, 0)), u.x), mix(skyHash13(i + vec3(0, 1, 0)), skyHash13(i + vec3(1, 1, 0)), u.x), u.y);
  float b = mix(mix(skyHash13(i + vec3(0, 0, 1)), skyHash13(i + vec3(1, 0, 1)), u.x), mix(skyHash13(i + vec3(0, 1, 1)), skyHash13(i + vec3(1, 1, 1)), u.x), u.y);
  return mix(a, b, u.z);
}
float skyFbm2(vec2 p) {
  float s = 0.0, a = 0.5;
  mat2 r = mat2(0.8, -0.6, 0.6, 0.8);
  for (int i = 0; i < 5; i++) { s += a * skyNoise2(p); p = r * p * 2.03 + 17.1; a *= 0.5; }
  return s;
}
float skyFbm3(vec3 p) {
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { s += a * skyNoise3(p); p = p * 2.07 + 11.3; a *= 0.5; }
  return s;
}
