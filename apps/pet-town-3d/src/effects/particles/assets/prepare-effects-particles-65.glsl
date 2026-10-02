
uniform sampler2D uAtlas;
uniform vec3 uFogColor;
uniform float uFogNear, uFogFar;
varying vec2 vUv;
varying vec4 vCol;
varying float vAdd, vSprite, vFogDepth;
void main() {
  float s = floor(vSprite + 0.5);
  vec2 cell = vec2(mod(s, 4.0), floor(s / 4.0));
  vec4 tx = texture2D(uAtlas, (cell + vUv) / 4.0);
  float a = tx.a * vCol.a;
  if (a < 0.004) discard;
  vec3 col = vCol.rgb * (0.55 + 0.45 * tx.r);
  float lum = max(max(vCol.r, vCol.g), vCol.b);
  col = mix(col, vec3(max(lum, 0.9)), tx.g * 0.92);
  float f = smoothstep(uFogNear, uFogFar, vFogDepth);
  col = mix(col, uFogColor * (1.0 - vAdd), f);
  a *= 1.0 - f * vAdd;
  gl_FragColor = vec4(col * a, a * (1.0 - vAdd));
}
