/** Creature state machine, social behavior, movement, animation and interaction methods. */
import * as THREE from "three";
export function creatureActorRandomLook() {
  let result = this.yaw + this.rng.range(-1.2, 1.2);
  this.look = new THREE.Vector3(
    this.position.x + Math.sin(result) * 3,
    this.position.y + this.rng.range(-0.5, 1.2),
    this.position.z + Math.cos(result) * 3,
  );
  this.lookT = this.rng.range(1, 2.5);
  this.tiltGoal = this.rng() < 0.3 ? this.rng.sign() * this.rng.range(0.15, 0.3) : 0;
}
