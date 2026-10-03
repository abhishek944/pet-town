/** Keyboard, mouse, touch, gamepad and pointer-lock input. */
import { playerState } from "../state.js";
export function preparePlayerInput() {
  playerState.playerKeyBindings = {
    fwd: [`KeyW`, `ArrowUp`],
    back: [`KeyS`, `ArrowDown`],
    left: [`KeyA`, `ArrowLeft`],
    right: [`KeyD`, `ArrowRight`],
    run: [`ShiftLeft`, `ShiftRight`],
    jump: [`Space`],
    dive: [`ControlLeft`, `ControlRight`, `OceanDive`],
    rotL: [`KeyQ`],
    rotR: [`KeyE`],
  };
  playerState.playerPreventDefaultKeys = new Set([
    `Space`,
    `ArrowUp`,
    `ArrowDown`,
    `ArrowLeft`,
    `ArrowRight`,
  ]);
}
