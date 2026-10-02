/** Follow-camera smoothing, orbit controls, obstruction avoidance and opening dolly. */
import * as THREE from "three";
export function initializePlayerCamera(context, world) {
  this.ctx = context;
  this.world = world;
  this.cam = context.camera;
  this.yaw = 0;
  this.pitch = 0.55;
  this.dist = 12;
  this.yawT = 0;
  this.pitchT = 0.55;
  this.distT = 12;
  this.minDist = 2.4;
  this.maxDist = 26;
  this.curDist = 12;
  this.frameLift = 0.12;
  this.frameAhead = 0.22;
  this.intro = null;
  this.introStarted = false;
  this.focus = new THREE.Vector3();
  this.fvel = new THREE.Vector3();
  this.baseFov = 38;
  this.fov = this.baseFov;
  this.frozen = false;
  this.dip = 0;
  this.dipV = 0;
  this.assist = 0;
  this.fade = 1;
  this.idleInput = 10;
  this.autoFollow = 0.22;
  this.lookAt = new THREE.Vector3();
}
