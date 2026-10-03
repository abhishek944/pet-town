export function playerCameraSnap(frame) {
  this.yaw = this.yawT;
  this.manualOrbitTime = 0;
  this.manualOrbit = false;
  this.pitch = this.pitchT;
  this.dist = this.curDist = this.distT;
  this.focus.set(frame.pos.x, frame.pos.y + 1.05, frame.pos.z);
  this.fvel.set(0, 0, 0);
  this.assist = this.assistTarget = this.assistHoldTime = 0;
  this.railLift = this.obstructionReleaseTime = 0;
  this.safePosition = null;
  this.safeFocus = null;
  this.jumpRecovery = false;
  this.jumpHoldTime = 0;
  this.jumpDistance = this.jumpRequestedDistance = this.distT;
  this.airCameraHeight = null;
  this.subjectHeight = frame.height ?? 1.7;
  this.aimCorrection = this.aimVelocity = this.occlusionTime = 0;
  this.visibilityWaypoint = null;
  this.comfortRecovery = false;
  this.cameraState = "reset";
  this.update(0, frame);
}
