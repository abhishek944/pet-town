import { sampleCreatureTerrainHeight } from "../world/sample-creature-terrain-height.js";
export function creatureActorPushOutOfWalls() {
  let position2 = this.position;
  let wallR2 = this.wallR;
  let result = position2.y + 0.05;
  let creatureTerrainHeightResult = sampleCreatureTerrainHeight(position2.x + wallR2, position2.z);
  let creatureTerrainHeightResult2 = sampleCreatureTerrainHeight(position2.x - wallR2, position2.z);
  let creatureTerrainHeightResult3 = sampleCreatureTerrainHeight(position2.x, position2.z + wallR2);
  let creatureTerrainHeightResult4 = sampleCreatureTerrainHeight(position2.x, position2.z - wallR2);
  if (
    creatureTerrainHeightResult != null &&
    creatureTerrainHeightResult > result &&
    Math.floor(position2.x + wallR2) > position2.x
  ) {
    position2.x = Math.min(position2.x, Math.floor(position2.x + wallR2) - wallR2);
  }
  if (
    creatureTerrainHeightResult2 != null &&
    creatureTerrainHeightResult2 > result &&
    Math.floor(position2.x - wallR2) + 1 < position2.x
  ) {
    position2.x = Math.max(position2.x, Math.floor(position2.x - wallR2) + 1 + wallR2);
  }
  if (
    creatureTerrainHeightResult3 != null &&
    creatureTerrainHeightResult3 > result &&
    Math.floor(position2.z + wallR2) > position2.z
  ) {
    position2.z = Math.min(position2.z, Math.floor(position2.z + wallR2) - wallR2);
  }
  if (
    creatureTerrainHeightResult4 != null &&
    creatureTerrainHeightResult4 > result &&
    Math.floor(position2.z - wallR2) + 1 < position2.z
  ) {
    position2.z = Math.max(position2.z, Math.floor(position2.z - wallR2) + 1 + wallR2);
  }
}
