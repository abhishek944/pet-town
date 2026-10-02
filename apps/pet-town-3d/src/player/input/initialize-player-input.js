import { isGameInputCaptured } from "../../core/input-capture.js";
/** Keyboard, mouse, touch, gamepad and pointer-lock input. */
import { isPlayerInputEditableTarget } from "./is-player-input-editable-target.js";
import { playerState } from "../state.js";
export function initializePlayerInput(context) {
  this.ctx = context;
  this.held = new Set();
  this.pressed = new Set();
  this.orbitX = 0;
  this.orbitY = 0;
  this.zoom = 0;
  this.drag = null;
  this.locked = false;
  this.lastDevice = `keyboard`;
  this.padJumpPrev = false;
  this.enabled = true;
  let result = context.canvas ?? context.renderer?.domElement ?? document.body;
  this.canvas = result;
  this._on(window, `keydown`, (event) => {
    if (!isGameInputCaptured(context, event) && !isPlayerInputEditableTarget(event)) {
      if (playerState.playerPreventDefaultKeys.has(event.code)) {
        event.preventDefault();
      }
      if (!event.repeat) {
        this.pressed.add(event.code);
      }
      this.held.add(event.code);
      this.lastDevice = `keyboard`;
      if (event.code === `KeyL` && !event.repeat) {
        this.togglePointerLock();
      }
    }
  });
  this._on(window, `keyup`, (event2) => {
    this.held.delete(event2.code);
  });
  this._on(window, `blur`, () => {
    this.held.clear();
    this.drag = null;
  });
  this._on(result, `contextmenu`, (event3) => event3.preventDefault());
  this.touches = new Map();
  this.pinch = 0;
  this._on(result, `pointerdown`, (event4) => {
    if (isGameInputCaptured(context, event4)) return;
    if (!this.locked) {
      if (event4.pointerType === `touch`) {
        if (
          (this.touches.set(event4.pointerId, {
            x: event4.clientX,
            y: event4.clientY,
          }),
          this.touches.size === 2)
        ) {
          let [position, position2] = [...this.touches.values()];
          this.pinch = Math.hypot(position.x - position2.x, position.y - position2.y);
          this.drag = null;
          return;
        }
        if (this.touches.size > 2) {
          return;
        }
      }
      this.drag = {
        id: event4.pointerId,
        x: event4.clientX,
        y: event4.clientY,
        moved: 0,
        button: event4.button,
      };
    }
  });
  this._on(window, `pointermove`, (event5) => {
    if (isGameInputCaptured(context, event5)) return;
    if (this.locked) {
      this.orbitX += event5.movementX;
      this.orbitY += event5.movementY;
      return;
    }
    if (
      this.touches.has(event5.pointerId) &&
      ((this.touches.get(event5.pointerId).x = event5.clientX),
      (this.touches.get(event5.pointerId).y = event5.clientY),
      this.touches.size === 2)
    ) {
      let [position3, position4] = [...this.touches.values()];
      let hypotResult = Math.hypot(position3.x - position4.x, position3.y - position4.y);
      this.zoom += (this.pinch - hypotResult) * 3;
      this.pinch = hypotResult;
      return;
    }
    let drag2 = this.drag;
    if (!drag2 || drag2.id !== event5.pointerId) {
      return;
    }
    let result2 = event5.clientX - drag2.x;
    let result3 = event5.clientY - drag2.y;
    drag2.x = event5.clientX;
    drag2.y = event5.clientY;
    drag2.moved += Math.abs(result2) + Math.abs(result3);
    if (drag2.button !== 0 || drag2.moved > 4) {
      this.orbitX += result2;
      this.orbitY += result3;
    }
  });
  let callback = (pointerIdValue) => {
    this.touches.delete(pointerIdValue.pointerId);
    if (this.drag && this.drag.id === pointerIdValue.pointerId) {
      this.drag = null;
    }
  };
  this._on(window, `pointerup`, callback);
  this._on(window, `pointercancel`, callback);
  this._on(
    result,
    `wheel`,
    (deltaYValue) => {
      if (isGameInputCaptured(context, deltaYValue)) return;
      this.zoom += deltaYValue.deltaY * (deltaYValue.deltaMode === 1 ? 16 : 1);
    },
    {
      passive: true,
    },
  );
  this._on(document, `pointerlockchange`, () => {
    this.locked = document.pointerLockElement === result;
  });
}
