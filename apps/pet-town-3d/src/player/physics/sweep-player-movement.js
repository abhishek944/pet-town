import { playerState } from "../state.js";
export function sweepPlayerMovement(velocity, deltaTime, position) {
  let verticalDistance = velocity.y * deltaTime;
  let verticalCollision = this._sweep(1, verticalDistance);
  let landed = verticalCollision && verticalDistance < 0;
  if (verticalCollision) {
    if (verticalDistance > 0) {
      velocity.y = Math.min(velocity.y, 0);
      this.jumping = false;
      this.events.push({
        type: `bonk`,
      });
    } else {
      velocity.y = 0;
    }
  }
  this.onGround = landed;
  let stepHeight =
    this.wasGround || this.onGround || this.coyote > 0 || this.swimming || this.waterExitT > 0
      ? playerState.playerMovementSettings.stepH
      : velocity.y < 5
        ? 0.55
        : 0;
  let canStep = stepHeight > 0 && this.stepLock <= 0;
  let distanceX = velocity.x * deltaTime;
  let distanceZ = velocity.z * deltaTime;
  let sweepAxes = Math.abs(distanceX) > Math.abs(distanceZ) ? [0, 2] : [2, 0];
  for (let result16 of sweepAxes) {
    let result17 = result16 === 0 ? distanceX : distanceZ;
    if (!result17) {
      continue;
    }
    let result18 = result16 === 0 ? position.x : position.z;
    if (this._sweep(result16, result17)) {
      let result19 = result17 - ((result16 === 0 ? position.x : position.z) - result18);
      if (canStep && Math.abs(result19) > 1e-5 && this._tryStep(result16, result19, stepHeight)) {
        if (
          (this.swimming || this.waterExitT > 0) &&
          (!Number.isFinite(this.waterY) ||
            position.y >= this.waterY - playerState.playerMovementSettings.swimExit)
        ) {
          this.swimming = false;
          velocity.y = Math.max(velocity.y, 0);
        }
      } else {
        if (result16 === 0) {
          velocity.x = 0;
        } else {
          velocity.z = 0;
        }
      }
    }
  }
}
