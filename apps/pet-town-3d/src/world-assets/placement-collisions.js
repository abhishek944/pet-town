import { playerWorldParse } from "../player/collision-world/player-world-parse.js";

export function placementCollision(context, ignored, x, z, hx, hz, y, terrain) {
  const parser = { groundBelow: (px, _py, pz) => terrain.h(px, pz) };
  for (const source of [context.props.colliders, context.colliders, context.world?.colliders]) {
    for (const raw of source?.values?.() ?? source ?? []) {
      if (ignored.has(raw) || raw.camOnly) continue;
      const c = playerWorldParse.call(parser, raw, false, x, z, Infinity);
      if (!c) continue;
      if (c.kind === "box") {
        if (c.minY > y + 8 || c.maxY < y) continue;
        if (x + hx > c.minX && x - hx < c.maxX && z + hz > c.minZ && z - hz < c.maxZ) return true;
      } else {
        if (c.y0 > y + 8 || c.y1 < y) continue;
        if (c.kind === "seg") {
          if (
            x + hx > Math.min(c.x1, c.x2) - c.r &&
            x - hx < Math.max(c.x1, c.x2) + c.r &&
            z + hz > Math.min(c.z1, c.z2) - c.r &&
            z - hz < Math.max(c.z1, c.z2) + c.r
          )
            return true;
        } else if (Math.abs(c.x - x) < hx + c.r && Math.abs(c.z - z) < hz + c.r) return true;
      }
    }
  }
  return false;
}
