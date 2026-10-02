
uniform float uTime;
uniform vec3 uLight, uSunDir;
attribute vec3 iPos, iVel;
attribute vec4 iA; // birth, life, size, sprite
attribute vec4 iB; // gravity, drag, spin, rot0
attribute vec4 iC; // rgb, additive
attribute vec4 iD; // swayAmp, swayFreq, sizeEnd, flags(emissive + 2*blink + 4*pop + 8*twinkle)
varying vec2 vUv;
varying vec4 vCol;
varying float vAdd, vSprite, vFogDepth;
void main() {
  float age = uTime - iA.x, life = iA.y;
  if (age < 0.0 || age > life) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
  float t = age / life;
  float k = max(iB.y, 1e-3), e = exp(-k * age);
  vec3 p = iPos + iVel * (1.0 - e) / k - vec3(0.0, iB.x, 0.0) * (age / k - (1.0 - e) / (k * k));
  float ph = iA.w * 1.7 + iPos.x * 3.1 + iPos.z * 1.3;
  float sw = iD.x * smoothstep(0.0, 0.4, age);
  p.x += sin(age * iD.y + ph) * sw;
  p.z += cos(age * iD.y * 0.83 + ph * 1.3) * sw;
  p.y += sin(age * iD.y * 0.6 + ph) * sw * 0.35;

  float flags = iD.w;
  float glint = step(32.0, flags); flags -= glint * 32.0;
  float isFlat = step(16.0, flags); flags -= isFlat * 16.0;
  float twinkle = step(8.0, flags); flags -= twinkle * 8.0;
  float pop = step(4.0, flags); flags -= pop * 4.0;
  float blink = step(2.0, flags); flags -= blink * 2.0;
  float emis = flags;

  float grow = mix(1.0, iD.z, t);
  float popS = pop > 0.5 ? (1.0 + 2.2 * exp(-t * 14.0) * sin(t * 22.0)) * smoothstep(0.0, 0.08, t) : smoothstep(0.0, 0.06, t);
  float size = iA.z * grow * max(popS, 0.0);
  if (twinkle > 0.5) size *= 0.75 + 0.35 * sin(age * 26.0 + ph);
  bool glow = iC.a > 0.5; // additive glowing kinds (fireflies, sparkles, pollen)
  float viewZ = -(modelViewMatrix * vec4(p, 1.0)).z;
  if (glow) size = min(size, 0.035 * viewZ); // keep glows point-like: no screen-filling orbs

  float rot = iB.w + iB.z * age;
  float cs = cos(rot), sn = sin(rot);
  vec2 c = position.xy;
  vec2 rc = vec2(c.x * cs - c.y * sn, c.x * sn + c.y * cs) * size;
  if (isFlat > 0.5) p.xz += rc;               // lies on the ground / water plane (ripples)
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  if (isFlat < 0.5) mv.xy += rc;              // camera-facing billboard
  gl_Position = projectionMatrix * mv;
  vFogDepth = -mv.z;

  float a = smoothstep(0.0, 0.07, t) * (1.0 - smoothstep(0.65, 1.0, t));
  if (blink > 0.5) a *= 0.3 + 0.7 * smoothstep(-0.3, 0.8, sin(age * 1.7 + ph * 2.0));
  // near-lens fade: ambient kinds (glow / glint: fireflies, pollen) fade by 2.5..6 units so they never become
  // blurry discs in front of the camera; burst kinds (hearts, dust...) keep a short fade so close emotes stay visible
  float camD = length(p - cameraPosition);
  a *= (glow || glint > 0.5) ? smoothstep(2.5, 6.0, camD) : smoothstep(0.6, 2.0, camD);
  if (glint > 0.5) a *= 0.7 + 2.3 * pow(max(dot(normalize(p - cameraPosition), uSunDir), 0.0), 6.0); // backlit sparkle
  // lit particles follow the day/night ambient; emissive ones keep their own colour
  vec3 light = mix(uLight, vec3(1.0), emis);
  vCol = vec4(iC.rgb * light, a * (iC.a < 0.0 ? -iC.a : 1.0));
  vAdd = max(iC.a, 0.0);
  vSprite = iA.w;
  vUv = c + 0.5;
}
