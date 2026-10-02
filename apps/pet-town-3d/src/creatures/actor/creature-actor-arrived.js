export function creatureActorArrived(radius) {
  return (
    this.goal && Math.hypot(this.goal.x - this.position.x, this.goal.z - this.position.z) < radius
  );
}
