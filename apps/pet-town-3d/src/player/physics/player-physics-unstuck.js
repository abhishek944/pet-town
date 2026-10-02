import { playerState } from "../state.js";
export function playerPhysicsUnstuck() {
  let pos2 = this.pos;
  let halfW2 = playerState.playerMovementSettings.halfW;
  let height2 = playerState.playerMovementSettings.height;
  let world2 = this.world;
  let result = 0.002;
  for (let index = 0; index < 3; index++) {
    if (this._free(pos2.x, pos2.y, pos2.z)) {
      return;
    }
    let result2 = 1 / 0;
    let result3 = -1 / 0;
    let result4 = 1 / 0;
    let result5 = -1 / 0;
    let result6 = 1 / 0;
    let result7 = -1 / 0;
    for (
      let result8 = Math.floor(pos2.x - halfW2 + 1e-4);
      result8 <= Math.floor(pos2.x + halfW2 - 1e-4);
      result8++
    ) {
      for (
        let result9 = Math.floor(pos2.y + 1e-4);
        result9 <= Math.floor(pos2.y + height2 - 1e-4);
        result9++
      ) {
        for (
          let result10 = Math.floor(pos2.z - halfW2 + 1e-4);
          result10 <= Math.floor(pos2.z + halfW2 - 1e-4);
          result10++
        ) {
          if (world2.solid(result8, result9, result10)) {
            result2 = Math.min(result2, result8);
            result3 = Math.max(result3, result8 + 1);
            result4 = Math.min(result4, result9);
            result5 = Math.max(result5, result9 + 1);
            result6 = Math.min(result6, result10);
            result7 = Math.max(result7, result10 + 1);
          }
        }
      }
    }
    let sortResult = [
      [0, result5 - pos2.y + result, 0],
      [0, result4 - (pos2.y + height2) - result, 0],
      [result3 - (pos2.x - halfW2) + result, 0, 0],
      [result2 - (pos2.x + halfW2) - result, 0, 0],
      [0, 0, result7 - (pos2.z - halfW2) + result],
      [0, 0, result6 - (pos2.z + halfW2) - result],
    ]
      .map((value) => ({
        d: value,
        cost: Math.abs(value[0]) + Math.abs(value[2]) + (value[1] > 0 ? value[1] : -value[1] * 1.5),
      }))
      .sort((costValue, costValue2) => costValue.cost - costValue2.cost);
    let enabled = false;
    for (let { d: result11 } of sortResult) {
      if (this._free(pos2.x + result11[0], pos2.y + result11[1], pos2.z + result11[2])) {
        pos2.x += result11[0];
        pos2.y += result11[1];
        pos2.z += result11[2];
        this.visualOffsetY -= result11[1];
        if (result11[1] > 0) {
          this.vel.y = Math.max(0, this.vel.y);
        }
        enabled = true;
        break;
      }
    }
    if (!enabled) {
      for (let result12 = 0.25; result12 <= 3.05; result12 += 0.25) {
        let result13 = Math.floor(pos2.y + result12);
        if (this._free(pos2.x, result13, pos2.z)) {
          this.visualOffsetY += pos2.y - result13;
          pos2.y = result13;
          this.vel.y = Math.max(0, this.vel.y);
          return;
        }
      }
      return;
    }
  }
}
