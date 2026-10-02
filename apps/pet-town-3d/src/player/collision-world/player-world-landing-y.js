export function playerWorldLandingY(x, z) {
  let surfaceAtResult = this.surfaceAt(x, z);
  let platformHeightResult = this.platformHeight(x, z, 1 / 0);
  return platformHeightResult > surfaceAtResult ? platformHeightResult : surfaceAtResult;
}
