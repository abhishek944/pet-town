/** Mobile joystick and jump controls that translate pointer gestures into keyboard input. */
import { hudState } from "../state.js";
import { setSimulatedTouchKey } from "./set-simulated-touch-key.js";
export let releaseAllTouchKeys = () => {
  for (let result of [...hudState.simulatedTouchKeys]) {
    setSimulatedTouchKey(result, false);
  }
};
