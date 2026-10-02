
uniform sampler2D tScene;
uniform highp sampler2D tDepth;
uniform vec2 uSunUv, uTexel;
uniform float uAspect;
varying vec2 vUv;
void main() {
  vec3 acc = vec3(0.0);
  for (int i = 0; i < 4; i++) {
    vec2 o = uTexel * (vec2(float(i & 1), float(i >> 1)) - 0.5);
    float d = texture2D(tDepth, vUv + o).x;
    vec3 c = min(texture2D(tScene, vUv + o).rgb, vec3(12.0));
    float sky = step(0.99999, d);
    acc += c * sky;
  }
  acc *= 0.25;
  float l = dot(acc, vec3(0.2126, 0.7152, 0.0722));
  vec2 dv = (vUv - uSunUv) * vec2(uAspect, 1.0);
  float nearSun = exp(-dot(dv, dv) * 3.0);
  gl_FragColor = vec4(acc * smoothstep(0.6, 2.2, l) * nearSun, 1.0);
}
