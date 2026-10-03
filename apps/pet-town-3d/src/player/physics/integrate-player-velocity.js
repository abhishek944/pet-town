import { playerState } from "../state.js";
import { integrateWaterSwimming } from "../../water/swimming/integrate-water-swimming.js";
export function integratePlayerVelocity(input, deltaTime, velocity, waterY, position, world) {
  let inputMagnitude = Math.min(1, Math.hypot(input.mx, input.mz));
  let movementSpeed;
  movementSpeed = this.swimming
    ? input.run
      ? playerState.playerMovementSettings.swimRun
      : playerState.playerMovementSettings.swim
    : this.gliding
      ? playerState.playerMovementSettings.glide
      : input.run
        ? playerState.playerMovementSettings.run
        : playerState.playerMovementSettings.walk;
  if (!this.swimming && this.onGround && this.waterDepth > 0.25) {
    movementSpeed *= 0.78;
  }
  let targetVelocityX = input.mx * movementSpeed;
  let targetVelocityZ = input.mz * movementSpeed;
  let accelerationRate;
  accelerationRate = this.swimming
    ? playerState.playerMovementSettings.swimK
    : this.onGround
      ? inputMagnitude > 0.05
        ? playerState.playerMovementSettings.groundK
        : playerState.playerMovementSettings.stopK
      : this.gliding
        ? playerState.playerMovementSettings.glideK
        : playerState.playerMovementSettings.airK;
  if (!this.onGround && !this.swimming && inputMagnitude < 0.05) {
    accelerationRate *= 0.25;
  }
  let accelerationBlend = 1 - Math.exp(-accelerationRate * deltaTime);
  if (
    ((velocity.x += (targetVelocityX - velocity.x) * accelerationBlend),
    (velocity.z += (targetVelocityZ - velocity.z) * accelerationBlend),
    this.jumpBuf > 0 &&
      !input.diveHeld &&
      this.diveTarget === null &&
      (this.swimming && this.waterDepth < playerState.playerMovementSettings.swimFloat + 0.35
        ? ((velocity.y = playerState.playerMovementSettings.swimJumpV),
          (this.swimming = false),
          (this.jumping = true),
          (this.jumpBuf = 0),
          (this.waterExitT = 0.55),
          (this.heldSinceJump = false),
          this.events.push({
            type: `jump`,
            fromWater: true,
          }))
        : !this.swimming &&
          (this.onGround || this.coyote > 0) &&
          !this.jumping &&
          ((velocity.y = playerState.playerMovementSettings.jumpV),
          (this.onGround = false),
          (this.coyote = 0),
          (this.jumpBuf = 0),
          (this.jumping = true),
          (this.heldSinceJump = true),
          (this.airTime = 0),
          this.events.push({
            type: `jump`,
          }))),
    (this.holdT = input.jumpHeld ? this.holdT + deltaTime : 0),
    input.jumpHeld || (this.heldSinceJump = false),
    this.swimming)
  ) {
    integrateWaterSwimming(
      this,
      input,
      deltaTime,
      waterY,
      position,
      velocity,
      playerState.playerMovementSettings,
    );
  } else {
    if (
      (!this.gliding &&
      !this.onGround &&
      input.jumpHeld &&
      velocity.y < 0.8 &&
      this.airTime > 0.16 &&
      (this.heldSinceJump || this.holdT > 0.14) &&
      position.y - world.groundBelow(position.x, position.y, position.z, 3) > 1.25
        ? ((this.gliding = true),
          (this.flutterUsed ||=
            ((velocity.y = Math.max(velocity.y, playerState.playerMovementSettings.flutterV)),
            true)),
          this.events.push({
            type: `glide`,
          }))
        : this.gliding && (!input.jumpHeld || this.onGround) && (this.gliding = false),
      this.gliding)
    ) {
      if (velocity.y > -playerState.playerMovementSettings.glideFall) {
        velocity.y = Math.max(
          -playerState.playerMovementSettings.glideFall,
          velocity.y -
            playerState.playerMovementSettings.gravity * (velocity.y > 0 ? 0.9 : 0.3) * deltaTime,
        );
      } else {
        velocity.y +=
          (-playerState.playerMovementSettings.glideFall - velocity.y) *
          (1 - Math.exp(-9 * deltaTime));
      }
    } else {
      let gravity2 = playerState.playerMovementSettings.gravity;
      if (velocity.y > 0) {
        if (this.jumping && !input.jumpHeld) {
          gravity2 *= playerState.playerMovementSettings.cutMult;
        }
      } else {
        gravity2 *= playerState.playerMovementSettings.fallMult;
      }
      velocity.y -= gravity2 * deltaTime;
      if (velocity.y < -playerState.playerMovementSettings.maxFall) {
        velocity.y = -playerState.playerMovementSettings.maxFall;
      }
    }
    if (this.onGround && velocity.y < 0) {
      this.jumping = false;
    }
  }
}
