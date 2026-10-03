import { OFFSHORE_ISLAND, OCEAN_PLACES } from "../layout.js";
const kelp = OCEAN_PLACES.find((place) => place.id === "kelp");

/** Fixed stepped seabed and a gently sloping eastern island landing. */
export function sampleOceanFloor(x, z) {
  const island = OFFSHORE_ISLAND;
  const distance = Math.hypot((x - island.x) / island.rx, (z - island.z) / island.rz);
  if (distance < 1.35) {
    // The 6.5-cell beach slope is traversable with the normal one-block step.
    return Math.max(1, Math.min(12, Math.floor(12 - (distance - 0.4) * 10)));
  }
  const reefDistance = Math.hypot(x - kelp.x, z - kelp.z);
  return reefDistance < 16 ? Math.max(1, Math.floor(4 - reefDistance / 7)) : 1;
}
