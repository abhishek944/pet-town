import { boatWorld, insideBoat } from "./coordinates.js";
import { BOAT_LENGTH, hullHalfWidth } from "./model.js";

export function overlapsBoatObstacle(c, x, y, z, r, height = 3) {
  if (c.kind === "obb") {
    const cos = Math.cos(c.yaw),
      sin = Math.sin(c.yaw);
    const dx = x - c.x,
      dz = z - c.z;
    return (
      y < c.y1 &&
      y + height > c.y0 &&
      Math.abs(cos * dx - sin * dz) < c.hx + r &&
      Math.abs(sin * dx + cos * dz) < c.hz + r
    );
  }
  if (c.kind === "box")
    return (
      y < c.maxY &&
      y + height > c.minY &&
      x + r > c.minX &&
      x - r < c.maxX &&
      z + r > c.minZ &&
      z - r < c.maxZ
    );
  if (y >= c.y1 || y + height <= c.y0) return false;
  let cx = c.kind === "seg" ? c.x1 : c.x,
    cz = c.kind === "seg" ? c.z1 : c.z;
  if (c.kind === "seg") {
    const dx = c.x2 - c.x1,
      dz = c.z2 - c.z1,
      length = dx * dx + dz * dz;
    const t = length ? Math.max(0, Math.min(1, ((x - cx) * dx + (z - cz) * dz) / length)) : 0;
    cx += t * dx;
    cz += t * dz;
  }
  return Math.hypot(x - cx, z - cz) < r + c.r;
}

/** Sample the complete inflated hull and cabin envelope against edited solids. */
export function boatPoseClear(context, pose, own) {
  const { terrain, water } = context;
  const world = context.player.world;
  const bounds = terrain.bounds;
  const colliders = [];
  // Normalized collider objects are copies; exclude owned raw sources before parsing.
  const raw = [
    context.props?.colliders,
    context.vegetation?.colliders ?? context.vegetation?.trees,
    context.colliders,
    context.world?.colliders,
  ].flatMap((items) => (items ? Array.from(items.values?.() ?? items) : []));
  for (const item of raw) {
    if (own.has(item)) continue;
    const c = world._parse(item, false, pose.x, pose.z, 10);
    if (c) colliders.push(c);
  }
  for (let row = 0; row <= 28; row++) {
    const z = -BOAT_LENGTH / 2 + row * 0.25;
    const width = hullHalfWidth(z) + 0.18;
    for (let x = -width; x <= width + 0.15; x += 0.3) {
      const p = boatWorld(pose, Math.min(x, width), -0.5, z);
      if (
        bounds &&
        (p.x < bounds.minX + 1 ||
          p.x > bounds.maxX - 1 ||
          p.z < bounds.minZ + 1 ||
          p.z > bounds.maxZ - 1)
      )
        return false;
      if (!water.isWater(p.x, p.z) || terrain.topY(p.x, p.z) > p.y - 0.08) return false;
      if (!world.boxFree(p.x - 0.16, p.y, p.z - 0.16, p.x + 0.16, p.y + 3.7, p.z + 0.16))
        return false;
      if (colliders.some((c) => overlapsBoatObstacle(c, p.x, p.y, p.z, 0.18))) return false;
    }
  }
  return true;
}

export function advanceBoat(context, boat, dt, throttle, steering, own) {
  const limit = throttle < 0 ? 2.3 : 5;
  const desired = throttle * limit;
  boat.speed += (desired - boat.speed) * (1 - Math.exp(-dt * (throttle ? 1.8 : 4)));
  const steps = Math.max(
    1,
    Math.ceil((Math.abs(boat.speed * dt) + Math.abs(steering * dt) * 4) / 0.12),
  );
  let blocked = false;
  for (let i = 0; i < steps; i++) {
    const turn =
      ((steering * dt) / steps) *
      Math.min(0.8, Math.abs(boat.speed) * 0.25) *
      (boat.speed < 0 ? -1 : 1);
    const next = { ...boat.pose, yaw: boat.pose.yaw - turn };
    next.x += (Math.sin(next.yaw) * boat.speed * dt) / steps;
    next.z += (Math.cos(next.yaw) * boat.speed * dt) / steps;
    if ((throttle || Math.abs(boat.speed) > 0.01 || turn) && !boatPoseClear(context, next, own)) {
      boat.speed = 0;
      blocked = true;
      break;
    }
    Object.assign(boat.pose, next);
  }
  return blocked;
}

export function freeBoatPoint(context, boat, local, radius = 0.38) {
  if (!insideBoat(local[0], local[2], radius)) return null;
  const p = boatWorld(boat.pose, ...local);
  if (
    !context.player.world.boxFree(
      p.x - radius,
      p.y + 0.01,
      p.z - radius,
      p.x + radius,
      p.y + 1.75,
      p.z + radius,
    )
  )
    return null;
  const colliders = context.player.world.gatherColliders(p.x, p.y, p.z, 5);
  if (colliders.some((c) => overlapsBoatObstacle(c, p.x, p.y + 0.01, p.z, radius, 1.75)))
    return null;
  return p;
}
