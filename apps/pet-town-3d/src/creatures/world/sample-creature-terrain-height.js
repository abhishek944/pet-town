/** Creature system namespace, world state, terrain queries, obstruction checks and nearby effects. */
import { getCreatureTerrain } from "./get-creature-terrain.js";
export function sampleCreatureTerrainHeight(value, value2) {
  try {
    let creatureTerrainResult = getCreatureTerrain();
    if (!creatureTerrainResult) {
      return null;
    }
    let result =
      typeof creatureTerrainResult.topY == `function`
        ? creatureTerrainResult.topY(value, value2)
        : creatureTerrainResult.heightAt?.(value, value2);
    return Number.isFinite(result) ? result : null;
  } catch {
    return null;
  }
}
