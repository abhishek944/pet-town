import { creaturesState } from "../state.js";
export function resolveCreatureSeparation(position, deltaTime, supportY, frame) {
  if (!this.pose) {
    for (let result15 of creaturesState.creaturesRuntime.list) {
      if (result15 === this || result15.flying !== this.flying) {
        continue;
      }
      let result16 = position.x - result15.position.x;
      let result17 = position.z - result15.position.z;
      let result18 = result16 * result16 + result17 * result17;
      let result19 = (this.bodyR + result15.bodyR) * 0.85;
      if (result18 < result19 * result19 && result18 > 1e-6) {
        let result20 = Math.sqrt(result18);
        let result21 = (result19 - result20) * 0.5 * Math.min(1, deltaTime * 8);
        let result22 = position.x + (result16 / result20) * result21;
        let result23 = position.z + (result17 / result20) * result21;
        if (this.flying || this.canSlideTo(result22, result23, supportY)) {
          position.x = result22;
          position.z = result23;
        }
      }
    }
    let player2 = frame.player;
    if (player2 && !this.flying) {
      let result24 = position.x - player2.x;
      let result25 = position.z - player2.z;
      let result26 = result24 * result24 + result25 * result25;
      let result27 = this.bodyR + 0.35;
      if (
        result26 < result27 * result27 &&
        result26 > 1e-6 &&
        Math.abs(player2.y - position.y) < 1.5
      ) {
        let result28 = Math.sqrt(result26);
        let result29 = (result27 - result28) * Math.min(1, deltaTime * 10);
        let result30 = position.x + (result24 / result28) * result29;
        let result31 = position.z + (result25 / result28) * result29;
        if (this.canSlideTo(result30, result31, supportY)) {
          position.x = result30;
          position.z = result31;
        }
      }
    }
  }
  if (!this.flying) {
    this.pushOutOfWalls();
  }
  this.progressT += deltaTime;
  if (this.progressT > 2) {
    if (this.goal && this.lastPos.distanceTo(position) < 0.2 && this.state !== `play`) {
      this.goal = null;
    }
    this.lastPos.copy(position);
    this.progressT = 0;
  }
}
