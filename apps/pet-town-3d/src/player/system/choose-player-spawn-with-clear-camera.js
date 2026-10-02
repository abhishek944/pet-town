/** Player spawn, context API, fixed-step orchestration, effects, render interpolation and demo controls. */
import { findPlayerVillageLookTarget } from "./find-player-village-look-target.js";
export function choosePlayerSpawnWithClearCamera(facingValue) {
  let {
    world: facingValueValue,
    body: facingValueValue2,
    cam: facingValueValue3,
    ctx: facingValueValue4,
  } = facingValue;
  let copy2 = facingValueValue2.pos.clone();
  let waterLevel2 = facingValueValue.waterLevel;
  let position = null;
  for (let result of [0, 2, 3.5, 5]) {
    for (let index = 0, result2 = result ? 8 : 1; index < result2; index++) {
      let result3 = (index / result2) * Math.PI * 2;
      let result4 = Math.floor(copy2.x + Math.cos(result3) * result) + 0.5;
      let result5 = Math.floor(copy2.z + Math.sin(result3) * result) + 0.5;
      let landingYResult = facingValueValue.landingY(result4, result5);
      if (
        (isFinite(waterLevel2) && landingYResult < waterLevel2 + 0.25) ||
        Math.abs(landingYResult - copy2.y) > 2.1 ||
        facingValueValue4.props?.isBlocked?.(result4, result5, 0.9) ||
        !facingValueValue.boxFree(
          result4 - 0.3,
          landingYResult + 0.01,
          result5 - 0.3,
          result4 + 0.3,
          landingYResult + 1.5,
          result5 + 0.3,
        )
      ) {
        continue;
      }
      let playerVillageLookTargetResult = findPlayerVillageLookTarget(facingValueValue4, {
        x: result4,
        z: result5,
      });
      let result6 = playerVillageLookTargetResult
        ? Math.atan2(
            playerVillageLookTargetResult.x - result4,
            playerVillageLookTargetResult.z - result5,
          )
        : facingValue.facing;
      facingValueValue3.focus.set(result4, landingYResult + 1.05, result5);
      facingValueValue.gatherColliders(result4, landingYResult, result5, 16);
      let pickClearYawResult = facingValueValue3.pickClearYaw(
        result6 + Math.PI,
        [0.3, -0.3, 0, 0.55, -0.55],
        false,
      );
      let result7 = pickClearYawResult.score - result * 0.12;
      if (!position || result7 > position.score) {
        position = {
          x: result4,
          y: landingYResult,
          z: result5,
          face: result6,
          yaw: pickClearYawResult.yaw,
          score: result7,
        };
      }
    }
  }
  return position
    ? (facingValueValue2.teleport(position.x, position.y + 0.002, position.z),
      facingValueValue2.spawn.set(position.x, position.y, position.z),
      facingValue.renderPos.copy(facingValueValue2.pos),
      (facingValueValue3.yawT = facingValueValue3.yaw = facingValueValue3.driftBase = position.yaw),
      position.face)
    : null;
}
