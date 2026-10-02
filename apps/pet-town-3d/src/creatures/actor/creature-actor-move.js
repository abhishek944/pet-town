import { advanceCreatureTowardGoal } from "./advance-creature-toward-goal.js";
import { resolveCreatureSeparation } from "./resolve-creature-separation.js";
import { updateCreatureHeightAndShadow } from "./update-creature-height-and-shadow.js";
import { getCreatureWaterLevel } from "../world/get-creature-water-level.js";
export function creatureActorMove(deltaTime, frame) {
  let position = this.position;
  let waterLevel = getCreatureWaterLevel();
  let supportY;
  ({ supportY } = advanceCreatureTowardGoal.call(this, position, deltaTime, waterLevel));
  resolveCreatureSeparation.call(this, position, deltaTime, supportY, frame);
  updateCreatureHeightAndShadow.call(this, position, waterLevel, deltaTime);
}
