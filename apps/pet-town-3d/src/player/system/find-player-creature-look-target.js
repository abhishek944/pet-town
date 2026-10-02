/** Player spawn, context API, fixed-step orchestration, effects, render interpolation and demo controls. */
import { wrapPlayerFacingAngle } from "./wrap-player-facing-angle.js";
import { playerState } from "../state.js";
export function findPlayerCreatureLookTarget(creaturesValue, position2, value) {
  let creatures2 = creaturesValue.creatures;
  if (!creatures2 || typeof creatures2[Symbol.iterator] != `function`) {
    return null;
  }
  let position3 = null;
  let result = 42.25;
  try {
    for (let result2 of creatures2) {
      let position4 =
        result2?.position ??
        result2?.mesh?.position ??
        result2?.group?.position ??
        result2?.root?.position ??
        result2?.object?.position;
      if (!position4 || typeof position4.x != `number`) {
        continue;
      }
      let result3 = position4.x - position2.x;
      let result4 = position4.z - position2.z;
      let result5 = result3 * result3 + result4 * result4;
      if (!(
        result5 > result ||
        result5 < 0.2 ||
        Math.abs(wrapPlayerFacingAngle(Math.atan2(result3, result4) - value)) > 1.4
      )) {
        result = result5;
        position3 = position4;
      }
    }
  } catch {
    return null;
  }
  return position3
    ? playerState.playerCreatureLookTarget.set(position3.x, position3.y + 0.5, position3.z)
    : null;
}
