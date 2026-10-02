import { playerState } from "../state.js";
export function playerPhysicsSweep(axis, distance) {
  if (distance === 0) {
    return false;
  }
  let pos2 = this.pos;
  let halfW2 = playerState.playerMovementSettings.halfW;
  let height2 = playerState.playerMovementSettings.height;
  let world2 = this.world;
  let values = [pos2.x - halfW2, pos2.y, pos2.z - halfW2];
  let values2 = [pos2.x + halfW2, pos2.y + height2, pos2.z + halfW2];
  let sliceResult = values.slice();
  let sliceResult2 = values2.slice();
  sliceResult[axis] += distance;
  sliceResult2[axis] += distance;
  let values3 = [0, 0, 0];
  let values4 = [0, 0, 0];
  for (let index = 0; index < 3; index++) {
    let result = index === axis ? Math.min(values[index], sliceResult[index]) : values[index];
    let result2 = index === axis ? Math.max(values2[index], sliceResult2[index]) : values2[index];
    values3[index] = Math.floor(result + playerState.playerCollisionEpsilon * 0.1);
    values4[index] = Math.floor(result2 - playerState.playerCollisionEpsilon * 0.1);
  }
  let value2Value = distance;
  let enabled = false;
  for (let result3 = values3[0]; result3 <= values4[0]; result3++) {
    for (let result4 = values3[1]; result4 <= values4[1]; result4++) {
      for (let result5 = values3[2]; result5 <= values4[2]; result5++) {
        let result6 = axis === 0 ? result3 : axis === 1 ? result4 : result5;
        if (
          !(distance > 0
            ? result6 < values2[axis] - playerState.playerCollisionEpsilon * 0.5
            : result6 + 1 > values[axis] + playerState.playerCollisionEpsilon * 0.5) &&
          world2.solid(result3, result4, result5)
        ) {
          if (distance > 0) {
            let result7 = result6 - values2[axis] - playerState.playerCollisionEpsilon;
            if (result7 < value2Value) {
              value2Value = Math.max(0, result7);
              enabled = true;
            }
          } else {
            let result8 = result6 + 1 - values[axis] + playerState.playerCollisionEpsilon;
            if (result8 > value2Value) {
              value2Value = Math.min(0, result8);
              enabled = true;
            }
          }
        }
      }
    }
  }
  if (axis === 0) {
    pos2.x += value2Value;
  } else {
    if (axis === 1) {
      pos2.y += value2Value;
    } else {
      pos2.z += value2Value;
    }
  }
  return enabled;
}
