
vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_INSTANCING
  mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
#ifdef VEG_BILLBOARD
{
  #ifdef USE_INSTANCING
    float bbScale = length(instanceMatrix[0].xyz);
  #else
    float bbScale = 1.0;
  #endif
  // Fringe only on the silhouette: cards whose anchor faces the camera collapse to nothing (no flat stickers).
  float facing = abs(dot(normalize(transformedNormal), normalize(-mvPosition.xyz)));
  float rimK = 1.0 - smoothstep(0.22, 0.55, facing);
  mvPosition.xy += aCard.xy * aCard.z * bbScale * fadeK * rimK;
}
#endif
gl_Position = projectionMatrix * mvPosition;
