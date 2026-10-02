
varying vec3 vGTint;
flat varying float vEdge;
varying vec2 vTUv;
varying vec2 vLUv;
flat varying float vTile;
flat varying float vOver;
flat varying float vDir;
varying float vAO;
varying float vBevel;
varying vec3 vTint;
varying vec3 vWPos;
varying vec3 vWNrm;
float tHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float tNoise(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(tHash(i), tHash(i + vec2(1.0, 0.0)), f.x), mix(tHash(i + vec2(0.0, 1.0)), tHash(i + vec2(1.0, 1.0)), f.x), f.y);
}
// anti-tiling for top faces: two differently rotated/offset reads of the same seamless tile, blended by world noise
float gTopMix;
vec2 gDX, gDY;            // uv derivatives, taken once at top level (derivatives in divergent branches are undefined)
vec3 gSX, gSY;            // view-position derivatives for bump mapping
vec4 sampleLayer(vec2 uv, float layer) {
  vec4 a = textureGrad(uAtlas, vec3(uv, layer), gDX, gDY);
  if (gTopMix <= 0.001) return a;
  vec2 uv2 = vec2(uv.y, -uv.x) + vec2(0.37, 0.61);
  vec4 b = textureGrad(uAtlas, vec3(uv2, layer), vec2(gDX.y, -gDX.x), vec2(gDY.y, -gDY.x));
  return mix(a, b, gTopMix);
}
bool isLipOverlay() { return abs(vOver - L_FRINGE) < 0.5 || abs(vOver - L_PATH_EDGE) < 0.5; }
float overlayA(vec2 uv, float lv) {
  float a = textureGrad(uAtlas, vec3(uv, vOver), gDX, gDY).a;
  // lip overlays (grass/path fringe) only live in the upper part of the block; lower rows are padding
  if ((vDir < 1.5 || vDir > 3.5) && isLipOverlay()) a *= smoothstep(0.3, 0.42, lv);
  return a;
}
vec3 terrainPerturb(vec3 surf_norm, vec2 dHdxy, float faceDirection) {
  vec3 vSigmaX = normalize(gSX);
  vec3 vSigmaY = normalize(gSY);
  vec3 vN = surf_norm;
  vec3 R1 = cross(vSigmaY, vN);
  vec3 R2 = cross(vN, vSigmaX);
  float fDet = dot(vSigmaX, R1) * faceDirection;
  vec3 vGrad = sign(fDet) * (dHdxy.x * R1 + dHdxy.y * R2);
  return normalize(abs(fDet) * surf_norm - vGrad);
}
