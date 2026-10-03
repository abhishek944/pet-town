import { playerState } from "../state.js";
export function playerCameraBasis(forward, right) {
  // Collision recovery can move the view far from its requested orbit. WASD
  // must remain relative to the view the player actually sees.
  this.cam.getWorldDirection(playerState.playerCameraForwardScratch);
  const yaw2 = Math.atan2(
    -playerState.playerCameraForwardScratch.x,
    -playerState.playerCameraForwardScratch.z,
  );
  forward.set(-Math.sin(yaw2), 0, -Math.cos(yaw2));
  right.set(Math.cos(yaw2), 0, -Math.sin(yaw2));
}
