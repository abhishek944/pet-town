import { updatePlayerWaterAndJumpWindows } from "./update-player-water-and-jump-windows.js";
import { integratePlayerVelocity } from "./integrate-player-velocity.js";
import { sweepPlayerMovement } from "./sweep-player-movement.js";
import { resolvePlayerLedgeSupport } from "./resolve-player-ledge-support.js";
import { snapPlayerToWalkSurfaces } from "./snap-player-to-walk-surfaces.js";
import { finishPlayerPhysicsStep } from "./finish-player-physics-step.js";
export function playerPhysicsStep(deltaTime, input) {
  input = this.world.ctx.boats?.beforeBodyStep(this, input) ?? input;
  this.time += deltaTime;
  let position = this.pos;
  let velocity = this.vel;
  let world = this.world;
  if ((this.prev.copy(position), this.frozen)) {
    this.visualOffsetY *= Math.exp(-deltaTime * 16);
    return;
  }
  this._unstuck();
  this.wasGround = this.onGround;
  let previousVerticalSpeed = velocity.y;
  let waterY;
  ({ waterY } = updatePlayerWaterAndJumpWindows.call(
    this,
    world,
    position,
    previousVerticalSpeed,
    velocity,
    deltaTime,
  ));
  integratePlayerVelocity.call(this, input, deltaTime, velocity, waterY, position, world);
  sweepPlayerMovement.call(this, velocity, deltaTime, position);
  resolvePlayerLedgeSupport.call(this, deltaTime, world, position, velocity);
  snapPlayerToWalkSurfaces.call(this, velocity, position, world);
  const result = finishPlayerPhysicsStep.call(
    this,
    world,
    position,
    velocity,
    previousVerticalSpeed,
    deltaTime,
  );
  this.world.ctx.boats?.afterBodyStep(this);
  return result;
}
