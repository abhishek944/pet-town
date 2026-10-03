/** Fixed-step player locomotion, jump buffering, coyote time, stepping, swimming and gliding. */
import * as THREE from "three";
export function initializePlayerPhysics(world) {
  this.world = world;
  this.pos = new THREE.Vector3();
  this.prev = new THREE.Vector3();
  this.vel = new THREE.Vector3();
  this.onGround = false;
  this.wasGround = false;
  this.coyote = 0;
  this.jumpBuf = 0;
  this.jumping = false;
  this.airTime = 0;
  this.groundTime = 0;
  this.gliding = false;
  this.flutterUsed = false;
  this.holdT = 0;
  this.heldSinceJump = false;
  this.swimming = false;
  this.diveTarget = null;
  this.diving = false;
  this.waterDepth = 0;
  this.waterY = -1 / 0;
  this.waterExitT = 0;
  this.visualOffsetY = 0;
  this.lastGroundY = 0;
  this.events = [];
  this.frozen = false;
  this.spawn = new THREE.Vector3();
  this.time = 0;
  this.stepLock = 0;
}
