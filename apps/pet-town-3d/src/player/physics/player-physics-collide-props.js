import { playerState } from "../state.js";
export function playerPhysicsCollideProps() {
  let colliders2 = this.world.colliders;
  if (!colliders2.length) {
    return;
  }
  let pos2 = this.pos;
  let vel2 = this.vel;
  let result = playerState.playerMovementSettings.halfW + 0.04;
  for (let position of colliders2) {
    if (position.kind === `cyl` || position.kind === `seg`) {
      if (
        pos2.y >= position.y1 - 0.001 ||
        pos2.y + playerState.playerMovementSettings.height <= position.y0
      ) {
        continue;
      }
      let x3 = position.x;
      let z3 = position.z;
      if (position.kind === `seg`) {
        let result9 = position.x2 - position.x1;
        let result10 = position.z2 - position.z1;
        let result11 = result9 * result9 + result10 * result10;
        let result12 =
          result11 > 0
            ? Math.max(
                0,
                Math.min(
                  1,
                  ((pos2.x - position.x1) * result9 + (pos2.z - position.z1) * result10) / result11,
                ),
              )
            : 0;
        x3 = position.x1 + result9 * result12;
        z3 = position.z1 + result10 * result12;
      }
      let result2 = pos2.x - x3;
      let result3 = pos2.z - z3;
      let result4 = result2 * result2 + result3 * result3;
      let result5 = position.r + result;
      if (result4 >= result5 * result5) {
        continue;
      }
      if (!position.noTop && vel2.y <= 0 && pos2.y > position.y1 - 0.3 && position.r > 0.25) {
        pos2.y = position.y1;
        vel2.y = 0;
        this._land();
        continue;
      }
      if (
        !position.noTop &&
        position.y1 - pos2.y <= 0.6 &&
        position.y1 > pos2.y &&
        (this.onGround || this.wasGround) &&
        position.r > 0.15 &&
        this._free(pos2.x, position.y1 + 0.01, pos2.z)
      ) {
        this.visualOffsetY -= position.y1 - pos2.y;
        pos2.y = position.y1;
        vel2.y = 0;
        this.onGround = true;
        continue;
      }
      let result6;
      let result7;
      if (result4 > 1e-10) {
        let result13 = Math.sqrt(result4);
        result6 = result2 / result13;
        result7 = result3 / result13;
      } else if (position.kind === `seg`) {
        let result14 = Math.hypot(position.x2 - position.x1, position.z2 - position.z1) || 1;
        result6 = -(position.z2 - position.z1) / result14;
        result7 = (position.x2 - position.x1) / result14;
      } else {
        result6 = 1;
        result7 = 0;
      }
      pos2.x = x3 + result6 * result5;
      pos2.z = z3 + result7 * result5;
      let result8 = vel2.x * result6 + vel2.z * result7;
      if (
        result8 < 0 &&
        ((vel2.x -= result8 * result6),
        (vel2.z -= result8 * result7),
        position.kind === `cyl` && position.r < 1.6)
      ) {
        let result15 = -result7;
        let result6Value = result6;
        let result16 = vel2.x * result15 + vel2.z * result6Value;
        let result17 = -result8 * 0.65;
        if (Math.abs(result16) < result17) {
          let result18 = result16 === 0 ? 1 : Math.sign(result16);
          vel2.x += result15 * result18 * (result17 - Math.abs(result16));
          vel2.z += result6Value * result18 * (result17 - Math.abs(result16));
        }
      }
    } else {
      let halfW2 = playerState.playerMovementSettings.halfW;
      let result19 = Math.min(pos2.x + halfW2 - position.minX, position.maxX - (pos2.x - halfW2));
      let result20 = Math.min(pos2.z + halfW2 - position.minZ, position.maxZ - (pos2.z - halfW2));
      let result21 = position.maxY - pos2.y;
      let result22 = pos2.y + playerState.playerMovementSettings.height - position.minY;
      if (result19 <= 0 || result20 <= 0 || result21 <= 0 || result22 <= 0) {
        continue;
      }
      if (!position.noTop && result21 < 0.3 && vel2.y <= 0.1) {
        pos2.y = position.maxY;
        vel2.y = 0;
        this._land();
        continue;
      }
      if (result22 < 0.25 && vel2.y > 0) {
        pos2.y = position.minY - playerState.playerMovementSettings.height;
        vel2.y = 0;
        continue;
      }
      if (result19 < result20) {
        let result23 = pos2.x < (position.minX + position.maxX) / 2 ? -1 : 1;
        pos2.x += result23 * result19;
        if (vel2.x * result23 < 0) {
          vel2.x = 0;
        }
      } else {
        let result24 = pos2.z < (position.minZ + position.maxZ) / 2 ? -1 : 1;
        pos2.z += result24 * result20;
        if (vel2.z * result24 < 0) {
          vel2.z = 0;
        }
      }
    }
  }
}
