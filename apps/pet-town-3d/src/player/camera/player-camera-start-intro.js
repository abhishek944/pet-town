/** Follow-camera smoothing, orbit controls, obstruction avoidance and opening dolly. */
import * as THREE from "three";
export function playerCameraStartIntro(duration = 2.5, force = false, from = null) {
  if (this.frozen || (this.introStarted && !force)) {
    return false;
  }
  this.introStarted = true;
  duration = Number.isFinite(duration) && duration > 0.05 ? duration : 2.5;
  let focus2 = this.focus;
  if (from && Number.isFinite(from.x) && Number.isFinite(from.y) && Number.isFinite(from.z)) {
    let result = from.x - focus2.x;
    let result2 = from.y - focus2.y;
    let result3 = from.z - focus2.z;
    let result4 = Math.max(0.5, Math.hypot(result, result2, result3));
    let worldDirectionResult = this.cam.getWorldDirection(new THREE.Vector3());
    let addScaledVectorResult = new THREE.Vector3(from.x, from.y, from.z).addScaledVector(
      worldDirectionResult,
      result4,
    );
    this._prepIntro();
    this.intro = this._planIntro({
      t: 0,
      dur: duration,
      yaw0: Math.atan2(result, result3),
      pitch0: Math.asin(Math.max(-1, Math.min(1, result2 / result4))),
      dist0: result4,
      look0: addScaledVectorResult,
      hold: false,
    });
    return true;
  }
  if (this.intro && this.intro.hold) {
    this.intro.hold = false;
    this.intro.t = 0;
    this.intro.dur = duration;
    return true;
  }
  this._prepIntro();
  let _establishingResult = this._establishing();
  this.intro = this._planIntro({
    t: 0,
    dur: duration,
    yaw0: _establishingResult.yaw,
    pitch0: _establishingResult.pitch,
    dist0: _establishingResult.dist,
    hold: false,
  });
  return true;
}
