
attribute float aSize;
attribute float aSeed;
attribute vec3 aColor;
uniform mat3 uStarRot;
uniform float uTime;
uniform float uNight;
uniform float uPixelRatio;
uniform vec3 uMoonDir;
uniform float uMoonSize;
varying vec3 vColor;
varying float vBright;
varying float vSpike;
void main() {
  vec3 d = uStarRot * position;
  vec4 p = projectionMatrix * vec4(mat3(viewMatrix) * d, 1.0);
  gl_Position = p.xyww; gl_Position.z *= 0.99999;
  float tw = 0.72 + 0.28 * sin(uTime * (1.3 + aSeed * 3.1) + aSeed * 40.0) * sin(uTime * (0.7 + aSeed * 1.7) + aSeed * 13.0);
  float horizon = smoothstep(-0.02, 0.22, d.y);
  float moonAng = acos(clamp(dot(d, normalize(uMoonDir)), -1.0, 1.0));
  float moonHide = smoothstep(uMoonSize * 1.05, uMoonSize * 2.2, moonAng);
  vBright = uNight * horizon * tw * moonHide;
  vColor = aColor;
  vSpike = smoothstep(2.6, 3.6, aSize);
  gl_PointSize = aSize * uPixelRatio * (vSpike > 0.0 ? 3.2 : 1.6);
  if (vBright < 0.003) gl_PointSize = 0.0;
}
