export function playerPhysicsTeleport(x, y, z) {
  this.pos.set(x, y, z);
  this.prev.copy(this.pos);
  this.vel.set(0, 0, 0);
  this.visualOffsetY = 0;
  this.lastGroundY = y;
  this.onGround = false;
}
