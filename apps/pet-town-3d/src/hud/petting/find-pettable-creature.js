/** Creature proximity, petting dispatch, response messages and heart overlays. */
import { getHudEntityPosition } from "./get-hud-entity-position.js";
import { hudState } from "../state.js";
import { getHudCreatures } from "./get-hud-creatures.js";
export function findPettableCreature() {
  let hudEntityPositionResult = getHudEntityPosition(hudState.hudContext.player);
  if (!hudEntityPositionResult) {
    return null;
  }
  let result = null;
  let result2 = 3.2;
  for (let result3 of getHudCreatures()) {
    let hudEntityPositionResult2 = getHudEntityPosition(result3);
    if (!hudEntityPositionResult2) {
      continue;
    }
    let hypotResult = Math.hypot(
      hudEntityPositionResult2.x - hudEntityPositionResult.x,
      (hudEntityPositionResult2.y - hudEntityPositionResult.y) * 0.5,
      hudEntityPositionResult2.z - hudEntityPositionResult.z,
    );
    if (hypotResult < result2) {
      result2 = hypotResult;
      result = result3;
    }
  }
  return result;
}
