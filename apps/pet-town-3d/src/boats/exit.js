import { boatWorld } from "./coordinates.js";
import { overlapsBoatObstacle } from "./navigation.js";
import { playerState } from "../player/state.js";

export function boatExitPoint(context, boat, dock, body) {
  const { halfW, height, swimFloat } = context.player.params;
  const radius = halfW + 0.08;
  const offsets = [
    [2.7, 2.3],
    [-2.7, 2.3],
    [0, 4.5],
    [2.8, 0],
    [-2.8, 0],
  ];
  const candidates = offsets.map(([x, z]) => boatWorld(boat.pose, x, 0, z));
  if (Math.hypot(boat.pose.x - dock.model.position.x, boat.pose.z - dock.model.position.z) < 7)
    candidates.unshift({ x: dock.model.position.x, z: dock.model.position.z });
  const actors = [
    playerState.playerRuntime.body,
    ...Array.from(context.petTown?.agents.records.values() ?? [], (a) => a.body),
  ];
  let swim = null;
  for (const { x, z } of candidates) {
    const surface = context.water.sample(x, z);
    let y = Math.max(dock.heightAt(x, z), context.terrain.topY(x, z));
    const dry = y > surface + 0.12;
    if (dry) {
      const support = (px, pz) => Math.max(dock.heightAt(px, pz), context.terrain.topY(px, pz));
      if (
        [-radius, radius].some((dx) =>
          [-radius, radius].some((dz) => Math.abs(support(x + dx, z + dz) - y) > 0.35),
        )
      )
        continue;
    } else {
      if (!context.water.isWater(x, z) || context.water.depthAt(x, z) < 1.5) continue;
      y = surface - swimFloat;
    }
    const world = body.world,
      bounds = world.bounds;
    if (
      x < bounds.minX + radius ||
      x > bounds.maxX - radius ||
      z < bounds.minZ + radius ||
      z > bounds.maxZ - radius
    )
      continue;
    if (!world.boxFree(x - radius, y + 0.01, z - radius, x + radius, y + height, z + radius))
      continue;
    if (
      world
        .gatherColliders(x, y, z, 5)
        .some((c) => overlapsBoatObstacle(c, x, y + 0.01, z, radius, height))
    )
      continue;
    if (
      actors.some(
        (a) =>
          a !== body &&
          Math.hypot(a.pos.x - x, a.pos.z - z) < radius * 2 &&
          a.pos.y < y + height &&
          a.pos.y + height > y,
      )
    )
      continue;
    if (dry) return { x, y, z, dry: true };
    swim ??= { x, y, z, dry: false };
  }
  return swim;
}
