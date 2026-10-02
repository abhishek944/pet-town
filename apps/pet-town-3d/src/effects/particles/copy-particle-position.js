/** Instanced particle presets, bursts, foliage drift, fireflies, pollen and motes. */
export function copyParticlePosition(position, target) {
  return position
    ? Array.isArray(position)
      ? target.set(position[0], position[1], position[2])
      : target.set(position.x ?? 0, position.y ?? 0, position.z ?? 0)
    : target.set(0, 0, 0);
}
