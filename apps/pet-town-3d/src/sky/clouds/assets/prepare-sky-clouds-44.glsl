
attribute vec4 iPuff;   // xyz world centre, w radius
attribute vec4 iCloud;  // xyz cloud base centre, w seed
attribute vec4 iShape;  // xyz half extents, w fade
varying vec2 vUv;
varying vec3 vPuffC;
varying float vR;
varying vec3 vCloudC;
varying vec3 vExt;
varying float vFade;
varying float vSeed;
varying vec3 vBillW;
void main() {
  vUv = position.xy;
  vPuffC = iPuff.xyz; vR = iPuff.w; vCloudC = iCloud.xyz; vSeed = iCloud.w; vExt = iShape.xyz; vFade = iShape.w;
  vec4 mv = viewMatrix * vec4(iPuff.xyz, 1.0);
  mv.xy += position.xy * iPuff.w;
  vBillW = iPuff.xyz + vec3(position.xy * iPuff.w, 0.0) * mat3(viewMatrix);
  vec4 p = projectionMatrix * mv;
  gl_Position = p; gl_Position.z = p.w * 0.99999;
  if (iShape.w <= 0.001) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
}
