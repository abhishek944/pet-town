/** Circle/rectangle overlap shared by vertical contact and stable prop support. */
export function playerPropFootprint(collider, x, z, radius = 0) {
  if (collider.kind === "box") {
    return (
      x + radius > collider.minX &&
      x - radius < collider.maxX &&
      z + radius > collider.minZ &&
      z - radius < collider.maxZ
    );
  }
  if (collider.kind === "obb") {
    const dx = x - collider.x,
      dz = z - collider.z;
    const cos = Math.cos(collider.yaw),
      sin = Math.sin(collider.yaw);
    return (
      Math.abs(cos * dx - sin * dz) < collider.hx + radius &&
      Math.abs(sin * dx + cos * dz) < collider.hz + radius
    );
  }
  let cx = collider.x,
    cz = collider.z;
  if (collider.kind === "seg") {
    const dx = collider.x2 - collider.x1,
      dz = collider.z2 - collider.z1;
    const t = Math.max(
      0,
      Math.min(1, ((x - collider.x1) * dx + (z - collider.z1) * dz) / (dx * dx + dz * dz || 1)),
    );
    cx = collider.x1 + dx * t;
    cz = collider.z1 + dz * t;
  }
  return Math.hypot(x - cx, z - cz) < collider.r + radius;
}
