/** Contract around a blocked orbit instead of pinning the eye to a wall. */
export function resolvePlayerCameraOrbit(queries, anchor, previous, desired, subject, radius, dt) {
  const clear = (eye) =>
    eye.distanceTo(subject) >= 0.8 &&
    !queries.overlaps(eye, radius).length &&
    !queries.sweep(anchor, eye, radius) &&
    !queries.sweep(previous, eye, radius);
  const desiredOffset = desired.clone().sub(anchor);
  const previousOffset = previous.clone().sub(anchor);
  // First look for a shorter boom at the requested angle. If the obstacle
  // blocks that whole arc, pull inward along the old boom to make room to turn.
  for (const offset of [desiredOffset, previousOffset]) {
    for (const scale of [0.8, 0.6, 0.4, 0.2]) {
      const distance = offset.length() * scale;
      if (distance < 1) continue;
      const candidate = anchor.clone().addScaledVector(offset, scale);
      if (!clear(candidate)) continue;
      const length = previous.distanceTo(candidate);
      const step = previous.clone().lerp(candidate, Math.min(1, (12 * dt) / Math.max(length, 1e-6)));
      if (clear(step)) return step;
    }
  }
  return null;
}
