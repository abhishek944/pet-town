
#if defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR )
  vColor = vec4(1.0);
#endif
#ifdef USE_COLOR
  vColor.rgb *= color;
#endif
#ifdef USE_INSTANCING_COLOR
  vColor.rgb *= mix(vec3(1.0), instanceColor.rgb, aTint);
#endif
vTint = aTint;
vSwayW = aSway;
#if defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR )
if (uPatch > 0.0) {
  // Gentle world-space colour drift so neighbouring tufts share hue (reads as meadow, not confetti).
  vec3 po = vegOrigin();
  float n1 = vegNoise(po.xz * 0.045 + 3.1);
  float n2 = vegNoise(po.xz * 0.17 - 7.3);
  vec3 warm = vec3(1.08, 1.04, 0.84);
  vec3 cool = vec3(0.88, 0.98, 0.96);
  vec3 pc = mix(cool, warm, smoothstep(0.2, 0.8, n1));
  pc *= 0.94 + 0.12 * n2;
  vColor.rgb *= mix(vec3(1.0), pc, uPatch * aTint);
}
#endif
