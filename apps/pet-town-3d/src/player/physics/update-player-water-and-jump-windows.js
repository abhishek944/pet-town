import { playerState } from "../state.js";
export function updatePlayerWaterAndJumpWindows(
  world,
  position,
  previousVerticalSpeed,
  velocity,
  deltaTime,
) {
  let waterY = world.waterSurface(position.x, position.y + 0.05, position.z);
  this.waterY = waterY;
  this.waterDepth = isFinite(waterY) ? waterY - position.y : 0;
  let wasSwimming = this.swimming;
  if (!this.swimming && this.waterDepth > playerState.playerMovementSettings.swimEnter) {
    this.swimming = true;
  } else {
    if (
      this.swimming &&
      (this.waterDepth < playerState.playerMovementSettings.swimExit ||
        (this.onGround && this.waterDepth < playerState.playerMovementSettings.swimFloat - 0.05))
    ) {
      this.swimming = false;
    }
  }
  if (this.swimming && !wasSwimming) {
    this.gliding = false;
    this.jumping = false;
    this.events.push({
      type: `splash`,
      speed: Math.abs(previousVerticalSpeed),
      y: waterY,
    });
    velocity.y *= 0.3;
  }
  if (!this.swimming && wasSwimming) {
    this.waterExitT = 0.45;
  }
  this.waterExitT = Math.max(0, this.waterExitT - deltaTime);
  this.jumpBuf = Math.max(0, this.jumpBuf - deltaTime);
  if (this.onGround) {
    this.coyote = playerState.playerMovementSettings.coyote;
    this.airTime = 0;
    this.groundTime += deltaTime;
    this.flutterUsed = false;
  } else {
    this.coyote = Math.max(0, this.coyote - deltaTime);
    this.airTime += deltaTime;
    this.groundTime = 0;
  }
  return {
    waterY,
  };
}
