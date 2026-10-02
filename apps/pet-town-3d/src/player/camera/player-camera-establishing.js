export function playerCameraEstablishing() {
  let result = null;
  for (let result2 of [0.9, -0.9, 0.5, -0.5, 1.4, -1.4, 0, 2.2, -2.2]) {
    for (let result3 of [0.42, 0.6, 0.8]) {
      let result4 = this.yawT + result2;
      if (this._los(result4, result3, 32) < 31.5) {
        continue;
      }
      let _planIntroResult = this._planIntro({
        yaw0: result4,
        pitch0: result3,
        dist0: 32,
      });
      if (((result ??= _planIntroResult), _planIntroResult.bump === 0)) {
        return {
          yaw: result4,
          pitch: result3,
          dist: 32,
          plan: _planIntroResult,
        };
      }
    }
  }
  return result
    ? {
        yaw: result.yaw0,
        pitch: result.pitch0,
        dist: 32,
        plan: result,
      }
    : {
        yaw: this.yawT + 0.9,
        pitch: 0.9,
        dist: 32,
      };
}
