/** Habitat-aware spawning, safe location selection and inspection lineups. */
import { creaturesState } from "../state.js";
import { getCreatureTerrain } from "../world/get-creature-terrain.js";
import { sampleCreatureTerrainHeight } from "../world/sample-creature-terrain-height.js";
import { spawnCreatureLineup } from "./spawn-creature-lineup.js";
import { spawnCreaturePopulation } from "./spawn-creature-population.js";
export function ensureCreaturesSpawned() {
  if (
    creaturesState.creaturesRuntime.spawned ||
    !getCreatureTerrain() ||
    sampleCreatureTerrainHeight(0, 0) == null
  ) {
    return;
  }
  let result = creaturesState.creaturesRuntime.ctx.params.get(`lineup`);
  if (result) {
    spawnCreatureLineup(result);
  } else {
    spawnCreaturePopulation();
  }
  creaturesState.creaturesRuntime.spawned = true;
}
