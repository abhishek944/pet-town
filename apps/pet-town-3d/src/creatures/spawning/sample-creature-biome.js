/** Habitat-aware spawning, safe location selection and inspection lineups. */
import { getCreatureTerrain } from "../world/get-creature-terrain.js";
export function sampleCreatureBiome(value, value2) {
  try {
    return getCreatureTerrain()?.biomeAt?.(value, value2) ?? null;
  } catch {
    return null;
  }
}
