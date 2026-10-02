export function playerCameraKick(impact) {
  this.dipV -= Math.min(impact, 25) * 0.05;
}
