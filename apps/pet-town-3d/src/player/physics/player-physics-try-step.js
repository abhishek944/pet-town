import { playerState } from "../state.js";
export function playerPhysicsTryStep(
  axis,
  distance,
  stepHeight = playerState.playerMovementSettings.stepH,
) {
  let pos2 = this.pos;
  let x2 = pos2.x;
  let y2 = pos2.y;
  let z2 = pos2.z;
  let result = stepHeight + 0.02;
  if ((this._sweep(1, result), pos2.y - y2 < 0.05)) {
    pos2.set(x2, y2, z2);
    return false;
  }
  let result2 = axis === 0 ? pos2.x : pos2.z;
  if (
    (this._sweep(axis, distance),
    Math.abs((axis === 0 ? pos2.x : pos2.z) - result2) < Math.abs(distance) * 0.5)
  ) {
    pos2.set(x2, y2, z2);
    return false;
  }
  this._sweep(1, -result - 0.01);
  let result3 = pos2.y - y2;
  return result3 < 0.02 || result3 > stepHeight + 0.03
    ? (pos2.set(x2, y2, z2), false)
    : ((this.visualOffsetY -= result3),
      this.events.push({
        type: `stepUp`,
        rise: result3,
      }),
      true);
}
