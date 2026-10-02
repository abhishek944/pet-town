export function playerCameraPickClearYaw(
  baseYaw,
  offsets = [0.3, -0.3, 0.55, -0.55, 0, 0.8, -0.8],
  apply = true,
) {
  let result = baseYaw + offsets[0];
  let result2 = -1 / 0;
  offsets.forEach((value3, value4) => {
    let result3 = baseYaw + value3;
    let _frameOccResult = this._frameOcc(result3, this.pitchT, this.distT);
    let _losResult = this._los(result3, this.pitchT, this.distT);
    let result4 =
      -(_frameOccResult.l + _frameOccResult.r) -
      Math.abs(_frameOccResult.l - _frameOccResult.r) * 0.5 +
      4 * Math.min(1, _losResult / this.distT) -
      value4 * 0.08;
    if (result4 > result2) {
      result2 = result4;
      result = result3;
    }
  });
  if (apply) {
    this.yawT = this.yaw = result;
    this.driftBase = result;
  }
  return {
    yaw: result,
    score: result2,
  };
}
