import { playerState } from "../state.js";
import { wrapPlayerCameraAngle } from "./wrap-player-camera-angle.js";
export function framePlayerCameraIntro(assistedPitch, focus, deltaTime) {
  let renderDistance = this.curDist;
  let renderYaw;
  let renderPitch = assistedPitch;
  let forwardX = -Math.sin(this.yaw);
  let forwardZ = -Math.cos(this.yaw);
  let lift = this.frameLift * renderDistance;
  let lookAhead = this.frameAhead * renderDistance * Math.max(0, Math.cos(renderPitch) - 0.2);
  let lookX = focus.x + forwardX * lookAhead;
  let lookY = focus.y + lift;
  let lookZ = focus.z + forwardZ * lookAhead;
  if (this.intro) {
    let intro2 = this.intro;
    if (!intro2.hold && deltaTime > 0) {
      intro2.t += deltaTime;
    }
    let result32 = intro2.hold ? 0 : Math.min(1, intro2.t / intro2.dur);
    let result33 =
      result32 < 0.5 ? 4 * result32 * result32 * result32 : 1 - (-2 * result32 + 2) ** 3 / 2;
    let result34 =
      (intro2.dYaw ?? wrapPlayerCameraAngle(this.yaw - intro2.yaw0)) +
      (intro2.yawF0 == null ? 0 : wrapPlayerCameraAngle(this.yaw - intro2.yawF0));
    renderYaw = intro2.yaw0 + result34 * result33;
    renderPitch =
      intro2.pitch0 +
      (assistedPitch - intro2.pitch0) * result33 +
      (intro2.bump ?? 0) * Math.sin(Math.PI * result33);
    renderDistance = intro2.dist0 + (this.curDist - intro2.dist0) * result33;
    let result35 = Math.cos(renderPitch);
    playerState.playerCameraOffsetDirection.set(
      Math.sin(renderYaw) * result35,
      Math.sin(renderPitch),
      Math.cos(renderYaw) * result35,
    );
    let result36 = intro2.look0 ? intro2.look0.x : focus.x;
    let result37 = intro2.look0 ? intro2.look0.y : focus.y - 0.05;
    let result38 = intro2.look0 ? intro2.look0.z : focus.z;
    lookX = result36 + (lookX - result36) * result33;
    lookY = result37 + (lookY - result37) * result33;
    lookZ = result38 + (lookZ - result38) * result33;
    if (
      result32 >= 1 ||
      !Number.isFinite(renderDistance + renderYaw + renderPitch + lookX + lookY + lookZ)
    ) {
      this.intro = null;
    }
  }
  return {
    renderDistance,
    lookX,
    lookY,
    lookZ,
  };
}
