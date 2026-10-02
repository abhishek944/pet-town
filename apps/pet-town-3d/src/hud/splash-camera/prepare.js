/** Obstacle-aware opening camera orbit and transition back to gameplay. */
import { hudState } from "../state.js";
export function prepareHudSplashCamera() {
  hudState.splashCameraSettings = {
    r: 24,
    h: 14,
    look: 1.7,
    sway: 0.25,
  };
}
