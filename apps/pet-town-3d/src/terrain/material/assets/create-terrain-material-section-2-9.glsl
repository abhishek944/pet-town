 && (vDir < 1.5 || vDir > 3.5)) {
  // pillow: each wall block bulges slightly toward its edges (breaks up big flat painted planes)
  vec2 e = vLUv * 2.0 - 1.0;
  vec2 t = sign(e) * smoothstep(0.75, 1.0, abs(e)) * vec2(0.05, 0.04) * uPillow;
  vec3 tu = vDir < 1.5 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
  // smooth rock undulation across blocks (world space, ~2.5 block wavelength) -> walls are not flat planes
  vec2 wp = vec2(dot(vWPos, tu), vWPos.y) * 0.42;
  float h0 = tNoise(wp), hu = tNoise(wp + vec2(0.35, 0.0)), hv = tNoise(wp + vec2(0.0, 0.35));
  float g0 = tNoise(wp * 2.3 + 7.1), gu = tNoise(wp * 2.3 + 7.1 + vec2(0.35, 0.0)), gv = tNoise(wp * 2.3 + 7.1 + vec2(0.0, 0.35));
  t -= (vec2(hu - h0, hv - h0) * 0.55 + vec2(gu - g0, gv - g0) * 0.25) * uPillow;
  vec3 offW = tu * t.x + vec3(0.0, 1.0, 0.0) * t.y;
  normal = normalize(normal + (viewMatrix * vec4(offW, 0.0)).xyz);
}
{
  float bs =
