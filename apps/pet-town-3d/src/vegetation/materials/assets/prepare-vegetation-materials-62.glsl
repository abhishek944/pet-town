
#ifdef VEG_FADE
if (uFadeR > 0.0) {
  // screen-door dither for fragments inside a capsule around the camera->player segment (never the last 10%
  // near the player, so foliage behind the player stays solid)
  vec3 ab = uFadeB - uFadeA;
  float t = clamp(dot(vFadeW - uFadeA, ab) / max(dot(ab, ab), 1e-4), 0.0, 1.0);
  float d = length(vFadeW - (uFadeA + ab * t));
  float k = (1.0 - smoothstep(uFadeR * 0.55, uFadeR, d)) * (1.0 - smoothstep(0.82, 0.95, t));
  vec2 pp = floor(mod(gl_FragCoord.xy, 4.0));
  float bayer = (mod(pp.x + 2.0 * pp.y, 4.0) * 4.0 + mod(pp.x * 3.0 + pp.y, 4.0)) / 16.0; // cheap ordered pattern
  if (k * 0.92 > bayer + 0.03) discard;
}
#endif
#ifdef VEG_BUMP
{
  vec3 bp = vWPos0 * uBumpFreq;
  gClump = vegCells(bp) * 0.78 + vegCells(bp * 2.6 + 17.0) * 0.22;
}
#endif
#ifdef USE_MAP
  #if defined(VEG_WORLDMAP)
    vec3 bw = pow(abs(normalize(vWN0)), vec3(4.0)); bw /= (bw.x + bw.y + bw.z);
    vec3 tp = vWPos0 * uTriScale;
    vec3 sampledDiffuseColor = texture2D(map, tp.zy).rgb * bw.x + texture2D(map, tp.xz + 0.37).rgb * bw.y + texture2D(map, tp.xy + 0.71).rgb * bw.z;
    diffuseColor.rgb *= mix(vec3(1.0), sampledDiffuseColor, vTint);
  #else
    vec4 sampledDiffuseColor = texture2D( map, vMapUv );
    diffuseColor.rgb *= mix(vec3(1.0), sampledDiffuseColor.rgb, vTint);
    #ifdef VEG_BILLBOARD
      diffuseColor.a *= sampledDiffuseColor.a;
    #endif
  #endif
#endif
  diffuseColor.rgb *= uTierTint;
#ifdef VEG_BUMP
  // Clump tops lighter/warmer, creases between clumps cooler/darker.
  diffuseColor.rgb *= mix(vec3(1.0), mix(vec3(0.84, 0.88, 0.94), vec3(1.06, 1.05, 0.97), smoothstep(0.1, 0.75, gClump)), vTint);
#endif
