import { FISHING_SHORE, FISHING_BOBBER, WISH_POSTS } from "./places.js";

/** Every support column must still be flat and dry after saved terrain edits. */
export function supportedGround(context, point, radius = 0.25) {
  const { terrain, water } = context;
  const level = water?.surfaceY ?? terrain.waterLevel;
  const height = terrain.topY(point.x, point.z);
  if (!Number.isFinite(height) || height <= level + 0.2) return null;
  for (let z = Math.floor(point.z - radius); z <= Math.floor(point.z + radius); z++) {
    for (let x = Math.floor(point.x - radius); x <= Math.floor(point.x + radius); x++) {
      const top = terrain.topY(x + 0.5, z + 0.5);
      if (!Number.isFinite(top) || Math.abs(top - height) > 0.1 || top <= level + 0.2) return null;
    }
  }
  return height;
}

export function fishingSupport(context) {
  const shore = supportedGround(context, FISHING_SHORE, 0.65);
  const level = context.water?.surfaceY ?? context.terrain.waterLevel;
  if (shore === null) return null;
  for (const dx of [-0.5, 0, 0.5]) {
    for (const dz of [-0.5, 0, 0.5]) {
      const x = FISHING_BOBBER.x + dx;
      const z = FISHING_BOBBER.z + dz;
      const top = context.terrain.topY(x, z);
      if (
        !Number.isFinite(top) ||
        top >= level - 0.15 ||
        context.terrain.blockAt(x, level, z) !== 0
      )
        return null;
    }
  }
  return { shore, water: level };
}

export function lanternSupport(context) {
  const heights = WISH_POSTS.map((point) => supportedGround(context, point));
  return heights.some((height) => height === null) ? null : heights;
}
