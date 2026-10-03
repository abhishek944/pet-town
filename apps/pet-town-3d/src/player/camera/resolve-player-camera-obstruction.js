import { Vector3 } from "three";
import { playerState } from "../state.js";
import { dampPlayerCameraValue } from "./damp-player-camera-value.js";
import { getPlayerCameraRailFocus } from "./get-player-camera-rail-focus.js";
import { choosePlayerCameraPitchAssist } from "./choose-player-camera-pitch-assist.js";
import { getPlayerCameraRadius } from "./get-player-camera-radius.js";

/** Keep requested zoom independent of the temporary collision distance. */
export function resolvePlayerCameraObstruction(world, deltaTime, frame) {
  const queries = this.ctx.cameraQueries;
  const jumping = frame && !frame.onGround && !frame.swimming && !frame.gliding;
  if (jumping && !this.jumpRecovery) {
    this.jumpDistance = this.curDist;
    this.jumpRequestedDistance = this.distT;
  }
  this.jumpHoldTime = jumping ? 0.2 : Math.max(0, this.jumpHoldTime - deltaTime);
  const followingJump =
    frame && !frame.swimming && !frame.gliding && (jumping || this.jumpHoldTime > 0);
  // A jump should not release a previously constrained boom and then pull it
  // sharply inward on landing. Explicit zoom input still changes this limit.
  const desiredDistance =
    followingJump && this.distT === this.jumpRequestedDistance
      ? Math.min(this.dist, this.jumpDistance)
      : this.dist;
  const focus = getPlayerCameraRailFocus.call(this, world, deltaTime);
  queries.prepare(focus, Math.max(this.distT, this.intro?.dist0 ?? 0), this.safePosition);
  const radius = getPlayerCameraRadius(this.cam);
  const endpoint = new Vector3();
  const sampleClearDistance = (pitch, distance = desiredDistance) => {
    const direction = playerState.playerCameraOffsetDirection;
    direction.set(
      Math.sin(this.yaw) * Math.cos(pitch),
      Math.sin(pitch),
      Math.cos(this.yaw) * Math.cos(pitch),
    );
    endpoint.copy(focus).addScaledVector(direction, distance);
    const hit = queries.sweep(focus, endpoint, radius);
    this.boomHit = hit;
    return hit ? Math.max(0, hit.distance - 0.03) : distance;
  };
  const targetAssist = choosePlayerCameraPitchAssist.call(
    this,
    sampleClearDistance,
    desiredDistance,
    deltaTime,
  );
  const entering = targetAssist !== 0 && Math.abs(targetAssist) > Math.abs(this.assist);
  this.assist =
    deltaTime > 0
      ? dampPlayerCameraValue(this.assist, targetAssist, entering ? 10 : 2.5, deltaTime)
      : targetAssist;
  const assistedPitch = this.pitch + this.assist;
  const clearDistance = Math.max(0.3, sampleClearDistance(assistedPitch));
  if (deltaTime <= 0 || clearDistance < this.curDist) {
    this.curDist = clearDistance;
    this.obstructionReleaseTime = 0.12;
  } else {
    this.obstructionReleaseTime = Math.max(0, this.obstructionReleaseTime - deltaTime);
    if (this.obstructionReleaseTime === 0) {
      this.curDist = dampPlayerCameraValue(this.curDist, clearDistance, 2.8, deltaTime);
    }
  }
  return { focus, assistedPitch };
}
