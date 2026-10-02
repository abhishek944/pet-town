
vec3 transformed = vec3(position) * uTierScale;
#if (defined(VEG_WORLDMAP) || defined(VEG_BUMP)) && !defined(VEG_DEPTH)
  // Undisplaced world-space position/normal: foliage texture + clump bump are unique per tree and don't swim.
  vWPos0 = (vegModel() * vec4(position, 1.0)).xyz;
  vWN0 = normalize(mat3(vegModel()) * normal);
#endif
float fadeK = 1.0;
{
  vec3 vo = vegOrigin();
  // Distance shrink for dense clutter (hides popping + saves fill at range).
  float camD = distance(vo, cameraPosition);
  fadeK = 1.0 - smoothstep(uFade.x, uFade.y, camD);
  // tufts right in front of the lens shrink away (no giant flat blades filling the screen)
  if (uNearFade.y > 0.0) fadeK *= smoothstep(uNearFade.x, uNearFade.y, camD);
  transformed *= fadeK;
  transformed += vegToLocal(vegDisplace(vo, position, aSway)) * fadeK;
}
#if defined(VEG_FADE) && !defined(VEG_DEPTH)
  vFadeW = (vegModel() * vec4(transformed, 1.0)).xyz;
#endif
