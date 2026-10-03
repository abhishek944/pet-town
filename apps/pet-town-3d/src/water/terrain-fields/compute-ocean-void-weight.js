import { OCEAN_PLACES } from "../layout.js";

/** Adding a playable seabed must not replace the original open-sea surface with visible sand. */
export function computeOceanVoidWeight(terrain, x, z, originalWeight) {
  const baseline = terrain?.ocean?.baselineSize;
  if (!Number.isFinite(baseline)) return originalWeight;
  const half = baseline / 2;
  const dx = Math.max(-half - x, 0, x - (half - 1));
  const dz = Math.max(-half - z, 0, z - (half - 1));
  const previousWeight = Math.min(1, Math.hypot(dx, dz) / 3);
  if (!previousWeight) return originalWeight;
  // New destinations can reveal their own seabed without restyling the rest of the sea.
  let habitat = 0;
  for (const place of OCEAN_PLACES) {
    const distance = Math.hypot(x - place.x, z - place.z);
    const reach = place.radius + (place.id === "island" ? 14 : 5);
    habitat = Math.max(habitat, Math.max(0, Math.min(1, (reach + 5 - distance) / 5)));
  }
  return Math.max(originalWeight, previousWeight * (1 - habitat));
}
