import { playerState } from "../state.js";
import { dampPlayerCameraValue } from "./damp-player-camera-value.js";
export function resolvePlayerCameraObstruction(world, deltaTime) {
  let desiredDistance = this.dist;
  let focus = this.focus;
  let sampleClearDistance = (value2) => {
    let result21 = Math.cos(value2);
    playerState.playerCameraOffsetDirection.set(
      Math.sin(this.yaw) * result21,
      Math.sin(value2),
      Math.cos(this.yaw) * result21,
    );
    playerState.playerCameraRightScratch.set(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
    playerState.playerCameraUpScratch
      .crossVectors(playerState.playerCameraOffsetDirection, playerState.playerCameraRightScratch)
      .normalize();
    let dist2Value = desiredDistance;
    for (let [result22, result23] of [
      [0, 0],
      [0.22, 0],
      [-0.22, 0],
      [0, 0.16],
      [0, -0.16],
    ]) {
      let result24 =
        focus.x +
        playerState.playerCameraRightScratch.x * result22 +
        playerState.playerCameraUpScratch.x * result23;
      let result25 =
        focus.y +
        playerState.playerCameraRightScratch.y * result22 +
        playerState.playerCameraUpScratch.y * result23;
      let result26 =
        focus.z +
        playerState.playerCameraRightScratch.z * result22 +
        playerState.playerCameraUpScratch.z * result23;
      let result27 =
        Math.min(
          world.raycast(
            result24,
            result25,
            result26,
            playerState.playerCameraOffsetDirection.x,
            playerState.playerCameraOffsetDirection.y,
            playerState.playerCameraOffsetDirection.z,
            desiredDistance + 0.4,
            true,
          ),
          world.raycastColliders(
            result24,
            result25,
            result26,
            playerState.playerCameraOffsetDirection.x,
            playerState.playerCameraOffsetDirection.y,
            playerState.playerCameraOffsetDirection.z,
            desiredDistance + 0.4,
          ),
        ) - 0.4;
      if (result27 < dist2Value) {
        dist2Value = result27;
      }
    }
    return dist2Value;
  };
  let assistedPitch = this.pitch + this.assist;
  sampleClearDistance(assistedPitch);
  let clearDistance;
  let minimumDesiredDistance = Math.min(desiredDistance, 2.6);
  let targetAssist = 0;
  let unassistedDistance = sampleClearDistance(this.pitch);
  if (unassistedDistance < minimumDesiredDistance) {
    let pitch2 = this.pitch;
    let callbackResult2Value = unassistedDistance;
    for (let result28 = 1; result28 <= 11; result28++) {
      let enabled = false;
      for (let result29 of [this.pitch + result28 * 0.12, this.pitch - result28 * 0.1]) {
        if (result29 > 1.42 || result29 < -0.3) {
          continue;
        }
        let callbackResult3 = sampleClearDistance(result29);
        if (
          (callbackResult3 > callbackResult2Value + 0.25 &&
            ((pitch2 = result29), (callbackResult2Value = callbackResult3)),
          callbackResult3 >= minimumDesiredDistance)
        ) {
          pitch2 = result29;
          enabled = true;
          break;
        }
      }
      if (enabled) {
        break;
      }
    }
    targetAssist = pitch2 - this.pitch;
  }
  if (
    ((this.assist =
      deltaTime > 0
        ? dampPlayerCameraValue(
            this.assist,
            targetAssist,
            targetAssist > this.assist ? 10 : 2.5,
            deltaTime,
          )
        : targetAssist),
    (assistedPitch = this.pitch + this.assist),
    (clearDistance = Math.max(0.3, sampleClearDistance(assistedPitch))),
    typeof world.canopySpan == `function`)
  ) {
    let canopySpanResult = world.canopySpan(
      focus.x,
      focus.y,
      focus.z,
      playerState.playerCameraOffsetDirection.x,
      playerState.playerCameraOffsetDirection.y,
      playerState.playerCameraOffsetDirection.z,
      clearDistance,
    );
    if (canopySpanResult) {
      let result30 = canopySpanResult[1] + 0.2;
      let result31 = Math.max(0.9, canopySpanResult[0] - 0.2);
      clearDistance =
        result30 - clearDistance < 4 &&
        world.raycast(
          focus.x,
          focus.y,
          focus.z,
          playerState.playerCameraOffsetDirection.x,
          playerState.playerCameraOffsetDirection.y,
          playerState.playerCameraOffsetDirection.z,
          result30 + 0.4,
          true,
        ) >=
          result30 + 0.3 &&
        result30 - clearDistance < (clearDistance - result31) * 1.5
          ? result30
          : result31;
    }
  }
  this.curDist =
    clearDistance < this.curDist
      ? deltaTime > 0
        ? dampPlayerCameraValue(this.curDist, clearDistance, 30, deltaTime)
        : clearDistance
      : dampPlayerCameraValue(this.curDist, clearDistance, 2.8, deltaTime);
  return {
    focus,
    assistedPitch,
  };
}
