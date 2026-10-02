export function playerCameraSnap(frame) {
  this.yaw = this.yawT;
  this.pitch = this.pitchT;
  this.dist = this.curDist = this.distT;
  this.focus.set(frame.pos.x, frame.pos.y + 1.05, frame.pos.z);
  this.fvel.set(0, 0, 0);
  this.update(0, frame);
}
