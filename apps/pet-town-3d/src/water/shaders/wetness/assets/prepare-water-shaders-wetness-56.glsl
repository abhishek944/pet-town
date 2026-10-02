
uniform sampler2D uWaterTex;
uniform vec4 uWaterRect;
uniform float uWaterSurfaceY;
uniform float uWaterTime;
// 0..1 wetness for a land surface point near the water (animated wash on open-sea beaches)
float waterWetness(vec3 wp) {
  vec2 uv = (wp.xz - uWaterRect.xy) / uWaterRect.zw;
  if (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) return 0.0;
  vec4 s = texture(uWaterTex, uv);
  float toWater = max(-s.r * 16.0, 0.0);               // blocks from this land column to the nearest water
  float above = wp.y - uWaterSurfaceY;
  float wash = 0.5 + 0.5 * sin(uWaterTime * 0.55 + wp.x * 0.13 + wp.z * 0.09);
  float reach = 0.55 + 0.35 * s.a + 0.9 * s.a * wash;
  float wet = 1.0 - smoothstep(reach * 0.55, reach, toWater);
  wet *= 1.0 - smoothstep(0.45, 1.25, above);
  return s.r <= 0.0 ? wet : 0.0;
}
