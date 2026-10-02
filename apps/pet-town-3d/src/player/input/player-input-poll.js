import { playerState } from "../state.js";
export function playerInputPoll(deltaTime) {
  let position = {
    x: 0,
    y: 0,
    run: false,
    jumpHeld: false,
    jumpPressed: false,
    orbitX: this.orbitX,
    orbitY: this.orbitY,
    zoom: this.zoom,
    rotate: 0,
    device: this.lastDevice,
    analog: false,
  };
  if (((this.orbitX = 0), (this.orbitY = 0), (this.zoom = 0), this.enabled)) {
    position.x =
      +!!this.any(playerState.playerKeyBindings.right) -
      !!this.any(playerState.playerKeyBindings.left);
    position.y =
      +!!this.any(playerState.playerKeyBindings.fwd) -
      !!this.any(playerState.playerKeyBindings.back);
    let hypotResult = Math.hypot(position.x, position.y);
    if (hypotResult > 1) {
      position.x /= hypotResult;
      position.y /= hypotResult;
    }
    position.run = this.any(playerState.playerKeyBindings.run);
    position.jumpHeld = this.any(playerState.playerKeyBindings.jump);
    position.jumpPressed = this.anyPressed(playerState.playerKeyBindings.jump);
    position.rotate =
      +!!this.any(playerState.playerKeyBindings.rotR) -
      !!this.any(playerState.playerKeyBindings.rotL);
  }
  this.pressed.clear();
  let values = [];
  try {
    values = navigator.getGamepads ? navigator.getGamepads() : [];
  } catch {}
  for (let result of values) {
    if (!result || !result.connected) {
      continue;
    }
    let callback = (value2, value3, value4 = 0.18) => {
      let hypotResult2 = Math.hypot(value2, value3);
      if (hypotResult2 < value4) {
        return [0, 0, 0];
      }
      let result3 = Math.min(1, (hypotResult2 - value4) / (1 - value4)) / hypotResult2;
      return [value2 * result3, value3 * result3, hypotResult2];
    };
    let [callbackResult, callbackResult2] = callback(result.axes[0] ?? 0, result.axes[1] ?? 0);
    let [callbackResult3, callbackResult4] = callback(
      result.axes[2] ?? 0,
      result.axes[3] ?? 0,
      0.15,
    );
    let callback2 = (value5) => !!result.buttons[value5]?.pressed;
    let callback2Result = callback2(0);
    let result2 = callback2Result && !this.padJumpPrev;
    if (
      ((this.padJumpPrev = callback2Result),
      callbackResult ||
        callbackResult2 ||
        callbackResult3 ||
        callbackResult4 ||
        result.buttons.some((pressedValue) => pressedValue?.pressed))
    ) {
      this.lastDevice = `gamepad`;
      if (this.enabled) {
        if (callbackResult || callbackResult2) {
          position.x = callbackResult;
          position.y = -callbackResult2;
          position.analog = true;
        }
        position.run = position.run || callback2(1) || callback2(7) || callback2(10);
        position.jumpHeld = position.jumpHeld || callback2Result;
        if (result2) {
          position.jumpPressed = true;
        }
        position.rotate += +!!callback2(5) - !!callback2(4);
      }
      position.orbitX += callbackResult3 * 900 * deltaTime;
      position.orbitY += callbackResult4 * 600 * deltaTime;
      if (callback2(12)) {
        position.zoom -= 900 * deltaTime;
      }
      if (callback2(13)) {
        position.zoom += 900 * deltaTime;
      }
      position.device = `gamepad`;
      break;
    }
  }
  return position;
}
