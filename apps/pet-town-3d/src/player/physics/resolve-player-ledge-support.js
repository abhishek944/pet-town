import { playerState } from "../state.js";
export function resolvePlayerLedgeSupport(deltaTime, world, position, velocity) {
  if (((this.stepLock = Math.max(0, this.stepLock - deltaTime)), this.onGround && !this.swimming)) {
    let halfW2 = playerState.playerMovementSettings.halfW;
    if (
      world.boxFree(
        position.x - halfW2,
        position.y - 0.06,
        position.z - halfW2,
        position.x + halfW2,
        position.y - 0.001,
        position.z + halfW2,
      )
    ) {
      this.onGround = false;
    } else {
      let index = 0;
      let index2 = 0;
      let index3 = 0;
      for (let [result20, result21] of [
        [0, 0],
        [0.2, 0],
        [-0.2, 0],
        [0, 0.2],
        [0, -0.2],
      ]) {
        if (
          world.solid(
            Math.floor(position.x + result20),
            Math.floor(position.y - 0.05),
            Math.floor(position.z + result21),
          )
        ) {
          index++;
        }
      }
      if (!index) {
        for (let [result22, result23] of [
          [halfW2, halfW2],
          [halfW2, -halfW2],
          [-halfW2, halfW2],
          [-halfW2, -halfW2],
        ]) {
          let result24 = Math.floor(position.x + result22);
          let result25 = Math.floor(position.z + result23);
          if (world.solid(result24, Math.floor(position.y - 0.05), result25)) {
            index2 += result24 + 0.5;
            index3 += result25 + 0.5;
            index++;
          }
        }
        if (index) {
          let result26 = position.x - index2 / index;
          let result27 = position.z - index3 / index;
          let result28 = Math.hypot(result26, result27) || 1;
          result26 /= result28;
          result27 /= result28;
          let result29 = 2.2 * deltaTime;
          if (
            -(velocity.x * result26 + velocity.z * result27) < 0.3 &&
            world.boxFree(
              position.x + result26 * result29 - halfW2,
              position.y + 0.01,
              position.z + result27 * result29 - halfW2,
              position.x + result26 * result29 + halfW2,
              position.y + playerState.playerMovementSettings.height,
              position.z + result27 * result29 + halfW2,
            )
          ) {
            position.x += result26 * result29;
            position.z += result27 * result29;
            if (
              world.boxFree(
                position.x - halfW2,
                position.y - 0.06,
                position.z - halfW2,
                position.x + halfW2,
                position.y - 0.001,
                position.z + halfW2,
              )
            ) {
              this.onGround = false;
            }
          }
        }
      }
    }
  }
}
