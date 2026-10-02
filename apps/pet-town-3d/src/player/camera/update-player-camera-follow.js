import { wrapPlayerCameraAngle } from "./wrap-player-camera-angle.js";
import { dampPlayerCameraValue } from "./damp-player-camera-value.js";
import { stepPlayerCameraCriticalSpring } from "./step-player-camera-critical-spring.js";
export function updatePlayerCameraFollow(deltaTime, frame) {
  if (deltaTime > 0 && frame.moving && this.idleInput > 1.2 && !frame.swimming) {
    let hypotResult = Math.hypot(frame.vel.x, frame.vel.z);
    if (hypotResult > 0.5) {
      let atan2Result = Math.atan2(-frame.vel.x, -frame.vel.z);
      let result15 = Math.sin(wrapPlayerCameraAngle(atan2Result - this.yawT));
      this.yawT += result15 * this.autoFollow * Math.min(1, hypotResult / 6) * deltaTime;
    }
  }
  if (
    (!frame.moving && this.idleInput < 0.1 && (this.driftBase = this.yawT),
    deltaTime > 0 && !frame.moving && this.idleInput > 2 && !this.intro)
  ) {
    this.driftBase ??= this.yawT;
    this._sideT = (this._sideT ?? 0) - deltaTime;
    if (this._sideT <= 0) {
      this._sideT = 0.3;
      this._side = this._frameOcc(this.yawT, this.pitchT, this.curDist);
    }
    let _side2 = this._side;
    if (_side2 && Math.max(_side2.l, _side2.r) > 1 && Math.abs(_side2.l - _side2.r) > 0.7) {
      let result16 = _side2.l > _side2.r ? -1 : 1;
      let result17 = this.yawT + result16 * 0.4 * deltaTime;
      if (Math.abs(wrapPlayerCameraAngle(result17 - this.driftBase)) < 0.8) {
        this.yawT = result17;
      }
    }
  }
  this.yaw = dampPlayerCameraValue(this.yaw, this.yawT, 16, deltaTime);
  this.pitch = dampPlayerCameraValue(this.pitch, this.pitchT, 16, deltaTime);
  this.dist = dampPlayerCameraValue(this.dist, this.distT, 9, deltaTime);
  let anchorY = frame.pos.y;
  if (!frame.onGround && !frame.swimming) {
    let lastGroundY2 = frame.lastGroundY;
    anchorY = frame.pos.y < lastGroundY2 ? frame.pos.y : Math.max(lastGroundY2, frame.pos.y - 1.4);
    if (frame.gliding) {
      anchorY = frame.pos.y - 0.4;
    }
  }
  if (frame.swimming) {
    anchorY = frame.pos.y + 0.25;
  }
  let targetX = frame.pos.x + frame.vel.x * 0.14;
  let targetZ = frame.pos.z + frame.vel.z * 0.14;
  let targetY = anchorY + 1.05;
  if (deltaTime > 0) {
    [this.focus.x, this.fvel.x] = stepPlayerCameraCriticalSpring(
      this.focus.x,
      this.fvel.x,
      targetX,
      10,
      deltaTime,
    );
    [this.focus.z, this.fvel.z] = stepPlayerCameraCriticalSpring(
      this.focus.z,
      this.fvel.z,
      targetZ,
      10,
      deltaTime,
    );
    [this.focus.y, this.fvel.y] = stepPlayerCameraCriticalSpring(
      this.focus.y,
      this.fvel.y,
      targetY,
      frame.onGround ? 7.5 : 5,
      deltaTime,
    );
    let result18 = frame.pos.x - this.focus.x;
    let result19 = frame.pos.z - this.focus.z;
    let hypotResult2 = Math.hypot(result18, result19);
    if (hypotResult2 > 2.2) {
      let result20 = (hypotResult2 - 2.2) / hypotResult2;
      this.focus.x += result18 * result20;
      this.focus.z += result19 * result20;
    }
    this.dipV += (-this.dip * 140 - this.dipV * 14) * deltaTime;
    this.dip += this.dipV * deltaTime;
  }
}
