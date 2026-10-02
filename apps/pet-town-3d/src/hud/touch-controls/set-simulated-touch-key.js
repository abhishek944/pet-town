/** Mobile joystick and jump controls that translate pointer gestures into keyboard input. */
import { hudState } from "../state.js";
export function setSimulatedTouchKey(code, pressed) {
  if (pressed === hudState.simulatedTouchKeys.has(code)) {
    return;
  }
  if (pressed) {
    hudState.simulatedTouchKeys.add(code);
  } else {
    hudState.simulatedTouchKeys.delete(code);
  }
  let result =
    code === `Space`
      ? ` `
      : code.startsWith(`Key`)
        ? code.slice(3).toLowerCase()
        : code === `ShiftLeft`
          ? `Shift`
          : code;
  dispatchEvent(
    new KeyboardEvent(pressed ? `keydown` : `keyup`, {
      code: code,
      key: result,
      bubbles: true,
    }),
  );
}
