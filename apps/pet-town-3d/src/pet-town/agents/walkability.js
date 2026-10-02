import { playerState } from "../../player/state.js";

const RADIUS = 0.36;
const HEIGHT = 1.42;

function overlapsCollider(collider, x, y, z) {
  if (collider.camOnly || collider.kind === "sph") return false;
  if (collider.kind === "box") {
    return (
      y < collider.maxY - 0.02 &&
      y + HEIGHT > collider.minY &&
      x + RADIUS > collider.minX &&
      x - RADIUS < collider.maxX &&
      z + RADIUS > collider.minZ &&
      z - RADIUS < collider.maxZ
    );
  }
  if (y >= collider.y1 - 0.02 || y + HEIGHT <= collider.y0) return false;
  let centerX = collider.x;
  let centerZ = collider.z;
  if (collider.kind === "seg") {
    const dx = collider.x2 - collider.x1;
    const dz = collider.z2 - collider.z1;
    const fraction = Math.max(
      0,
      Math.min(1, ((x - collider.x1) * dx + (z - collider.z1) * dz) / (dx * dx + dz * dz || 1)),
    );
    centerX = collider.x1 + dx * fraction;
    centerZ = collider.z1 + dz * fraction;
  }
  return Math.hypot(x - centerX, z - centerZ) < collider.r + RADIUS;
}

export function walkableHeight(world, x, z, previousY) {
  const bounds = world.bounds;
  if (x < bounds.minX + 1 || x > bounds.maxX - 1 || z < bounds.minZ + 1 || z > bounds.maxZ - 1)
    return null;
  let y = world.landingY(x, z);
  if (!Number.isFinite(y) || y < world.waterLevel + 0.06) return null;
  // Physics steps up when the body's leading edge reaches a block, before its
  // center does. Use the same footprint so a walkable step is not a false wall.
  const { halfW, stepH } = playerState.playerMovementSettings;
  for (const ox of [-halfW, halfW]) {
    for (const oz of [-halfW, halfW]) {
      y = Math.max(y, world.surfaceAt(x + ox, z + oz));
    }
  }
  if (Number.isFinite(previousY) && (y - previousY > stepH + 0.02 || previousY - y > stepH + 0.15))
    return null;
  if (!world.boxFree(x - halfW, y + 0.04, z - halfW, x + halfW, y + HEIGHT, z + halfW)) return null;
  if (world.colliders.some((collider) => overlapsCollider(collider, x, y, z))) return null;
  return y;
}

export function clearWalkingSegment(world, start, end) {
  const distance = Math.hypot(end.x - start.x, end.z - start.z);
  const steps = Math.max(1, Math.ceil(distance / 0.2));
  let groundY = start.y;
  for (let step = 1; step <= steps; step++) {
    const y = walkableHeight(
      world,
      start.x + ((end.x - start.x) * step) / steps,
      start.z + ((end.z - start.z) * step) / steps,
      groundY,
    );
    if (y === null) return false;
    groundY = y;
  }
  return true;
}

export function gatherAgentColliders(record, records) {
  const { world, body } = record;
  world.gatherColliders(body.pos.x, body.pos.y, body.pos.z, 8);
  for (const other of records.values()) {
    if (other === record || other.body.pos.distanceToSquared(body.pos) > 64) continue;
    world.colliders.push({
      kind: "cyl",
      x: other.body.pos.x,
      z: other.body.pos.z,
      r: 0.28,
      y0: other.body.pos.y,
      y1: other.body.pos.y + HEIGHT,
      noTop: true,
    });
  }
}
