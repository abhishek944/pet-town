/** Habitat-aware spawning, safe location selection and inspection lineups. */
import { creaturesState } from "../state.js";
export function prepareCreaturesSpawning() {
  creaturesState.creatureSpawnBiomes = new Set([
    `meadow`,
    `plains`,
    `forest`,
    `path`,
    `hills`,
    `beach`,
    null,
  ]);
}
