
float ambientOcclusion = vAO;
reflectedLight.indirectDiffuse *= ambientOcclusion;
// low sun: the sky fill is very blue; warm it on cliff faces (full) and tops (partial) so shadowed
// earth/stone keeps its warmth instead of turning navy/maroon. Luminance-neutral tint.
{
  float sideW = (vDir < 1.5 || vDir > 3.5) ? 1.0 : 0.4;
  reflectedLight.indirectDiffuse *= mix(vec3(1.0), uFillFix, uWarmShadow * sideW);
}
reflectedLight.directDiffuse *= mix(1.0, ambientOcclusion, uAODirect);
#if defined( USE_ENVMAP ) && defined( STANDARD )
  float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
  reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
#endif
