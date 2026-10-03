// Original rounded foliage cells and surface-gradient bump.
vec3 vegH3(vec3 p) {
  p = vec3(dot(p, vec3(127.1, 311.7, 74.7)), dot(p, vec3(269.5, 183.3, 246.1)), dot(p, vec3(113.5, 271.9, 124.6)));
  return fract(sin(p) * 43758.5453);
}
// Worley F1/F2 -> rounded leaf-clump domes (from F1) with creased rims where clumps meet (F2 - F1 -> 0).
float vegCells(vec3 p) {
  vec3 i = floor(p), f = fract(p); float d1 = 8.0, d2 = 8.0;
  for (int z = -1; z <= 1; z++) for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec3 g = vec3(float(x), float(y), float(z));
    vec3 r = g + vegH3(i + g) * 0.75 + 0.125 - f;
    float d = dot(r, r);
    if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d;
  }
  d1 = sqrt(d1); d2 = sqrt(d2);
  float dome = 1.0 - d1 * d1 * 1.1;                // rounded dome over each clump
  float crease = smoothstep(0.0, 0.4, d2 - d1);    // soft dip where two clumps meet
  return clamp(dome * 0.72 + crease * 0.28, 0.0, 1.0);
}
// Surface-gradient bump (Mikkelsen) with UNnormalised screen derivatives: h is a height in metres, so the
// relief is resolution independent (three's bump convention measures height per pixel and fades to nothing).
vec3 vegPerturb(vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDir) {
  vec3 dpdx = dFdx(surf_pos), dpdy = dFdy(surf_pos);
  vec3 R1 = cross(dpdy, surf_norm);
  vec3 R2 = cross(surf_norm, dpdx);
  float fDet = dot(dpdx, R1) * faceDir;
  vec3 vGrad = sign(fDet) * (dHdxy.x * R1 + dHdxy.y * R2);
  return normalize(abs(fDet) * surf_norm - vGrad);
}
