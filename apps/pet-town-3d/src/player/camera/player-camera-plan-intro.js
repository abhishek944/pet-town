import { wrapPlayerCameraAngle } from "./wrap-player-camera-angle.js";
export function playerCameraPlanIntro(intro) {
  let yawT2 = this.yawT;
  let pitchT2 = this.pitchT;
  let distT2 = this.distT;
  let wrapPlayerCameraAngleResult = wrapPlayerCameraAngle(yawT2 - intro.yaw0);
  let values = [];
  for (let result3 of [0, 0.3, 0.6]) {
    for (let result4 of [
      wrapPlayerCameraAngleResult,
      wrapPlayerCameraAngleResult - Math.sign(wrapPlayerCameraAngleResult || 1) * Math.PI * 2,
    ]) {
      values.push({
        dYaw: result4,
        bump: result3,
      });
    }
  }
  let result = values[0];
  let result2 = 1 / 0;
  for (let result5 of values) {
    if (Math.abs(result5.dYaw) > Math.PI * 1.6) {
      continue;
    }
    let index = 0;
    for (let result6 of [0.15, 0.35, 0.55, 0.75, 0.9]) {
      let result7 = intro.yaw0 + result5.dYaw * result6;
      let result8 =
        intro.pitch0 +
        (pitchT2 - intro.pitch0) * result6 +
        result5.bump * Math.sin(Math.PI * result6);
      let result9 = intro.dist0 + (distT2 - intro.dist0) * result6;
      if (this._los(result7, result8, result9) < result9 - 0.6) {
        index++;
      }
    }
    if ((index < result2 && ((result2 = index), (result = result5)), index === 0)) {
      break;
    }
  }
  intro.dYaw = result.dYaw;
  intro.bump = result.bump;
  intro.yawF0 = yawT2;
  return intro;
}
