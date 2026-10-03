import { dampPlayerCameraValue } from "./damp-player-camera-value.js";

/** Lift the boom's pivot gently above nearby low rails, without moving the actor. */
export function getPlayerCameraRailFocus(world, deltaTime) {
  const focus = this.focus;
  let lift = 0;
  let overlapLift = 0;
  for (const rail of world.colliders) {
    if (rail.kind !== "seg" || rail.y0 > focus.y + 0.16) continue;
    const sx = rail.x2 - rail.x1;
    const sz = rail.z2 - rail.z1;
    const lengthSquared = sx * sx + sz * sz;
    if (lengthSquared < 1e-12) continue;
    const along = Math.max(
      0,
      Math.min(1, ((focus.x - rail.x1) * sx + (focus.z - rail.z1) * sz) / lengthSquared),
    );
    const distance = Math.hypot(focus.x - rail.x1 - along * sx, focus.z - rail.z1 - along * sz);
    const clearance = Math.max(0, rail.y1 + 0.24 - focus.y);
    // A ray starting inside a rail cannot escape by changing pitch. Include
    // the lateral samples and square end caps in this immediate safety lift.
    if (distance <= rail.r * Math.SQRT2 + 0.28 && focus.y - 0.16 <= rail.y1) {
      overlapLift = Math.max(overlapLift, clearance);
    }
    if (rail.y1 - focus.y > 0.65) continue;
    const proximity = Math.max(0, Math.min(1, (1.2 - distance) / 0.6));
    // Include the vertical ray offset so a pivot beside a rail starts above it.
    lift = Math.max(lift, clearance * proximity);
  }
  this.railLift =
    deltaTime > 0
      ? dampPlayerCameraValue(this.railLift, lift, lift > this.railLift ? 15 : 3, deltaTime)
      : lift;
  this.railLift = Math.max(this.railLift, overlapLift);
  return this.obstructionFocus.copy(focus).setY(focus.y + this.railLift);
}
