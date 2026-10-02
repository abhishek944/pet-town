/** Cached effect textures, instanced billboards, decals, smoke, campfire particles and pooled lights. */
export function appendLampGlows(glowValue, value, value2, value3) {
  if (value2 < 0.02) {
    return;
  }
  let result = value2 * 0.42 * (0.96 + 0.04 * Math.sin(value3 * 3));
  for (let position of value) {
    glowValue.glow.push(
      position.x,
      position.y,
      position.z,
      1.3,
      1.3,
      1 * result,
      0.72 * result,
      0.36 * result,
      1,
    );
  }
}
