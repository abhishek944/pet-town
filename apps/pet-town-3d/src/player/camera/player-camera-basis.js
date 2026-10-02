import { playerState } from "../state.js";
export function playerCameraBasis(forward, right) {
  let yaw2 = this.yaw;
  if (this.frozen) {
    this.cam.getWorldDirection(playerState.playerCameraForwardScratch);
    yaw2 = Math.atan2(
      -playerState.playerCameraForwardScratch.x,
      -playerState.playerCameraForwardScratch.z,
    );
  }
  forward.set(-Math.sin(yaw2), 0, -Math.cos(yaw2));
  right.set(Math.cos(yaw2), 0, -Math.sin(yaw2));
}
