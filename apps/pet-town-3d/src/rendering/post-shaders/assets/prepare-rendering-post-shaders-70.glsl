
uniform sampler2D tDiffuse;
uniform vec3 defaultColor;
uniform float defaultOpacity, luminosityThreshold, smoothWidth;
uniform vec2 uTexel;
uniform highp sampler2D tDepth;
varying vec2 vUv;
float lum(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }
vec3 tap(vec2 o, inout float ws) {
  vec2 uv = vUv + o * uTexel;
  vec3 c = texture2D(tDiffuse, uv).rgb;
  c *= mix(1.0, 0.4, step(0.99999, texture2D(tDepth, uv).x)); // sky blooms less (facing the sun stays legible)
  float w = 1.0 / (1.0 + lum(c));
  ws += w; return c * w;
}
void main() {
  float ws = 0.0;
  vec3 c = tap(vec2(-0.5, -0.5), ws) + tap(vec2(0.5, -0.5), ws) + tap(vec2(-0.5, 0.5), ws) + tap(vec2(0.5, 0.5), ws);
  c /= ws;
  float a = smoothstep(luminosityThreshold, luminosityThreshold + smoothWidth, lum(c));
  gl_FragColor = mix(vec4(defaultColor, defaultOpacity), vec4(c, 1.0), a);
}
