/** Intersect a finite rail in its local frame, including its height and end caps. */
export function raycastPlayerFenceSegment(segment, x, y, z, dx, dy, dz, maxDistance) {
  const sx = segment.x2 - segment.x1;
  const sz = segment.z2 - segment.z1;
  const length = Math.hypot(sx, sz);
  if (length < 1e-6) return maxDistance;
  const ux = sx / length;
  const uz = sz / length;
  const ox = x - segment.x1;
  const oz = z - segment.z1;
  const radius = segment.r;
  let enter = 0;
  let exit = maxDistance;
  // The existing five camera rays supply the camera's lateral clearance.
  for (const [origin, direction, min, max] of [
    [ox * ux + oz * uz, dx * ux + dz * uz, -radius, length + radius],
    [y, dy, segment.y0, segment.y1],
    [-ox * uz + oz * ux, -dx * uz + dz * ux, -radius, radius],
  ]) {
    if (Math.abs(direction) < 1e-9) {
      if (origin < min || origin > max) return maxDistance;
      continue;
    }
    let near = (min - origin) / direction;
    let far = (max - origin) / direction;
    if (near > far) [near, far] = [far, near];
    enter = Math.max(enter, near);
    exit = Math.min(exit, far);
    if (enter > exit) return maxDistance;
  }
  return enter;
}
