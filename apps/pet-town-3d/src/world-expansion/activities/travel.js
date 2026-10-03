import { expansionRestored } from "./places.js";

function overlaps(collider, x, y, z, radius, height) {
  if (collider.kind === "box") {
    return (
      y < collider.maxY &&
      y + height > collider.minY &&
      x + radius > collider.minX &&
      x - radius < collider.maxX &&
      z + radius > collider.minZ &&
      z - radius < collider.maxZ
    );
  }
  if (y >= collider.y1 || y + height <= collider.y0) return false;
  let cx = collider.x;
  let cz = collider.z;
  if (collider.kind === "seg") {
    const dx = collider.x2 - collider.x1;
    const dz = collider.z2 - collider.z1;
    const length = dx * dx + dz * dz;
    const t = length
      ? Math.max(0, Math.min(1, ((x - collider.x1) * dx + (z - collider.z1) * dz) / length))
      : 0;
    cx = collider.x1 + t * dx;
    cz = collider.z1 + t * dz;
  }
  return Math.hypot(x - cx, z - cz) < radius + collider.r;
}

/** Query restored terrain and current colliders, including newly built obstructions. */
export function travelToPlace(context, place) {
  if (context.petTown?.controller.selected)
    throw new Error("Choose Leave in Companions before travelling with your explorer.");
  if (!expansionRestored(context))
    throw new Error("Your saved world is still loading. Try again in a moment.");
  const { world, params } = context.player;
  const radius = (params?.halfW ?? 0.35) + 0.12;
  const height = params?.height ?? 1.7;
  const offsets = [
    [0.5, 0.5],
    [-1.5, 0.5],
    [0.5, -1.5],
    [2.5, 0.5],
    [0.5, 2.5],
    [-2.5, -1.5],
    [3.5, -1.5],
  ];
  for (const [dx, dz] of offsets) {
    const x = place.x + dx;
    const z = place.z + dz;
    const y = context.terrain.topY(x, z) + 0.01;
    if (
      !Number.isFinite(y) ||
      y <= context.terrain.waterLevel + 0.4 ||
      context.terrain.slopeAt(x, z) > 1
    )
      continue;
    if (context.props?.isBlocked(x, z, radius)) continue;
    if (!world.boxFree(x - radius, y, z - radius, x + radius, y + height, z + radius)) continue;
    if (world.gatherColliders(x, y, z, 6).some((item) => overlaps(item, x, y, z, radius, height)))
      continue;
    context.player.teleport(x, y, z);
    return;
  }
  throw new Error(
    "This destination is obstructed by saved blocks or scenery. Clear a little space or walk there along the path.",
  );
}
