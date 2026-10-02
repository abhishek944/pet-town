
#include <packing>
uniform highp sampler2D tDepth;
uniform float cameraNear, cameraFar;
uniform float uFocusY, uBand, uRamp, uTopAmt, uBottomAmt, uFocusDist, uFarAmt, uNearAmt;
uniform vec3 uAOTint; uniform float uAOStrength;

float viewZAt(vec2 uv) { return -perspectiveDepthToViewZ(texture2D(tDepth, uv).x, cameraNear, cameraFar); }

// 0 = sharp, 1 = maximum blur
float cocAt(vec2 uv, float z) {
  float dy = uv.y - uFocusY;
  // tilt-shift band (uTopAmt/uBottomAmt are already scaled by camera pitch on the CPU: eye-level views get none).
  // The top band only softens things that are actually behind the focus plane.
  float tilt = dy > 0.0 ? smoothstep(uBand, uBand + uRamp, dy) * uTopAmt * smoothstep(uFocusDist * 0.8, uFocusDist * 1.6, z)
                        : smoothstep(uBand, uBand + uRamp * 0.8, -dy) * uBottomAmt;
  // depth terms stay gentle: only really distant scenery and things hugging the lens go soft
  float far = smoothstep(max(uFocusDist * 1.8, 20.0), max(uFocusDist * 5.0, 80.0), z) * uFarAmt;
  float near = (1.0 - smoothstep(uFocusDist * 0.2, uFocusDist * 0.42, z)) * uNearAmt;
  float coc = max(max(tilt, far), near);
  // sky / clouds / sun / stars stay (almost) crisp: blurring them only makes fake halos
  if (z > cameraFar * 0.95) coc *= 0.15;
  return clamp(coc, 0.0, 1.0);
}

// HDR firefly guard: specular spikes (seen up to ~9000 on glossy creatures facing the sun) would otherwise
// bloom into screen-sized orbs. Hue-preserving clamp; anything above ~12 is white after tone mapping anyway.
vec3 sanitize(vec3 c) {
  if (any(isnan(c)) || any(isinf(c))) return vec3(0.0);
  float m = max(c.r, max(c.g, c.b));
  return m > 12.0 ? c * (12.0 / m) : max(c, 0.0);
}
// scene alpha < 0.75 marks surfaces that must not receive SSAO (water writes 0.5: foam stays white)
float aoMask(float a) { return smoothstep(0.7, 0.8, a); }
vec3 applyAO(vec3 c, float ao) { return c * mix(vec3(1.0), uAOTint, (1.0 - ao) * uAOStrength); }
float luma(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }
float ign(vec2 p) { return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))); }
