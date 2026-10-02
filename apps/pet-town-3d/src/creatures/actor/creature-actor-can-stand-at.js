import { isCreatureInsideWorld } from "../world/is-creature-inside-world.js";
import { sampleCreatureSupportHeight } from "../world/sample-creature-support-height.js";
import { getCreatureWaterLevel } from "../world/get-creature-water-level.js";
import { isCreaturePositionBlocked } from "../world/is-creature-position-blocked.js";
export function creatureActorCanStandAt(x, z, previousHeight) {
  if (!isCreatureInsideWorld(x, z)) {
    return false;
  }
  let creatureSupportHeightResult = sampleCreatureSupportHeight(x, z);
  if (creatureSupportHeightResult == null) {
    return false;
  }
  let creatureWaterLevelResult = getCreatureWaterLevel();
  if (
    creatureSupportHeightResult < creatureWaterLevelResult - 0.05 &&
    !this.swimmer &&
    !this.flying &&
    this.state !== `escape`
  ) {
    return false;
  }
  if (this.flying) {
    return !isCreaturePositionBlocked(x, z, this.def.radius * 0.5, this.position.y);
  }
  if (isCreaturePositionBlocked(x, z, this.def.radius * 0.55 * this.size)) {
    return false;
  }
  let result = this.inWater
    ? Math.max(creatureSupportHeightResult, creatureWaterLevelResult)
    : creatureSupportHeightResult;
  return !(
    (previousHeight != null && result - previousHeight > 1.25) ||
    (previousHeight != null && previousHeight - result > 2.6)
  );
}
