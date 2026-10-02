/** Mobile joystick and jump controls that translate pointer gestures into keyboard input. */
import { hudState } from "../state.js";
export let shouldShowTouchControls = () => {
  try {
    return (
      matchMedia(hudState.touchControlMediaQuery).matches ||
      new URLSearchParams(location.search).has(`touch`)
    );
  } catch {
    return false;
  }
};
