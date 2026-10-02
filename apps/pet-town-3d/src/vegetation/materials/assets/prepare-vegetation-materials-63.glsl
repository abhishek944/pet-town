
#ifdef VEG_TOON
{
  // Two-band toon ramp on the (bumped) normal: sunlit clump faces warm + light, turned-away faces cool.
  float key = dot(normal, uSunDirView);
  float band = smoothstep(-0.02, 0.22, key + (gClump - 0.45) * 0.35);
  outgoingLight *= mix(vec3(1.0), mix(uToonCool, uToonWarm, band), vTint); // foliage only (not berries / blooms)
}
#endif
{
  vec3 vdir = normalize(vViewPosition);
  float ndv = saturate(dot(normal, vdir));
  float rim = pow(1.0 - ndv, 2.5) * uRim;
  float tipK = mix(1.0, saturate(vSwayW * 2.4), uTipGlow);
  // broad back-light (canopies glow when the sun is behind them), strongest at grazing angles / silhouettes
  float back = pow(saturate(dot(-vdir, uSunDirView)), 2.0) * (1.0 - 0.6 * ndv) * uTrans * tipK;
  float lit = 0.55 + 0.45 * saturate(dot(normal, uSunDirView) * 0.5 + 0.5);
  // Soft fluffy rim + back-lit leaf/blade glow, both driven by the actual sun (so nothing glows at night).
  outgoingLight += diffuseColor.rgb * uSunLight * (rim * lit * vTint * tipK + back * (0.3 + 0.7 * vTint) + uSoft * vTint);
}
#include <opaque_fragment>
