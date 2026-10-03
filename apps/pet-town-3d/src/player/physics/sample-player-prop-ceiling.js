import { playerState } from "../state.js";

/** Include the head footprint when entering beneath the edge of a sloped roof. */
export function samplePlayerPropCeiling(collider, x, z) {
  const fallback = collider.y0 ?? collider.minY;
  if (!collider.ceilingHeight) return fallback;
  const r = playerState.playerMovementSettings.halfW;
  let bottom = Infinity;
  for (const [dx, dz] of [
    [0, 0],
    [-r, -r],
    [-r, r],
    [r, -r],
    [r, r],
  ]) {
    const y = collider.ceilingHeight(x + dx, z + dz);
    if (Number.isFinite(y)) bottom = Math.min(bottom, y);
  }
  return Number.isFinite(bottom) ? bottom : fallback;
}
