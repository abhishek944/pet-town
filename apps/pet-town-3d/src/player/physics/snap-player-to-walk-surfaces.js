import { playerState } from "../state.js";
export function snapPlayerToWalkSurfaces(velocity, position, world) {
  if ((this._collideProps(), velocity.y <= 0.01 && !this.swimming)) {
    let result30 = this.onGround || this.wasGround;
    let result31 = Math.max(position.y + (result30 ? 0.6 : 0.05), this.prev.y + 0.01);
    let platformHeightResult = world.platformHeight(position.x, position.z, result31);
    let result32 = (result30 && !this.jumping ? 0.6 : 0.02) + Math.max(0, this.prev.y - position.y);
    if (
      platformHeightResult > -1 / 0 &&
      platformHeightResult >= position.y - result32 &&
      this._free(position.x, platformHeightResult + 0.01, position.z)
    ) {
      if (Math.abs(platformHeightResult - position.y) > 0.01 && result30) {
        this.visualOffsetY += position.y - platformHeightResult;
      }
      position.y = platformHeightResult;
      velocity.y = 0;
      this.onGround = true;
    }
  }
  if (!this.onGround && this.wasGround && !this.jumping && velocity.y <= 0 && !this.swimming) {
    let y3 = position.y;
    if (this._sweep(1, -(playerState.playerMovementSettings.stepH + 0.05))) {
      let result33 = y3 - position.y;
      if (result33 > 0.01) {
        this.visualOffsetY += result33;
        this.events.push({
          type: `stepDown`,
          drop: result33,
        });
      }
      this.onGround = true;
      velocity.y = 0;
    } else {
      position.y = y3;
    }
  }
}
