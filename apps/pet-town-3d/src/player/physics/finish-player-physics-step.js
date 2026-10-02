import { playerState } from "../state.js";
export function finishPlayerPhysicsStep(
  world,
  position,
  velocity,
  previousVerticalSpeed,
  deltaTime,
) {
  let bounds = world.bounds;
  let edgePadding = playerState.playerMovementSettings.halfW + 0.01;
  if (
    (position.x < bounds.minX + edgePadding &&
      ((position.x = bounds.minX + edgePadding), (velocity.x = Math.max(0, velocity.x))),
    position.x > bounds.maxX - edgePadding &&
      ((position.x = bounds.maxX - edgePadding), (velocity.x = Math.min(0, velocity.x))),
    position.z < bounds.minZ + edgePadding &&
      ((position.z = bounds.minZ + edgePadding), (velocity.z = Math.max(0, velocity.z))),
    position.z > bounds.maxZ - edgePadding &&
      ((position.z = bounds.maxZ - edgePadding), (velocity.z = Math.min(0, velocity.z))),
    position.y < world.floorY - 30)
  ) {
    this.teleport(this.spawn.x, this.spawn.y + 2, this.spawn.z);
    this.events.push({
      type: `respawn`,
    });
    return;
  }
  if (this.onGround && !this.wasGround) {
    this.gliding = false;
    this.jumping = false;
    this.events.push({
      type: `land`,
      impact: Math.max(0, -previousVerticalSpeed),
      air: this.airTime,
    });
  }
  if (this.onGround) {
    this.lastGroundY = position.y;
  }
  this.visualOffsetY *= Math.exp(-deltaTime * 16);
  if (Math.abs(this.visualOffsetY) < 1e-4) {
    this.visualOffsetY = 0;
  }
}
