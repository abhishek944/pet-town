import { playerInputPoll } from "./player-input-poll.js";
import { playerInputAnyPressed } from "./player-input-any-pressed.js";
import { playerInputAny } from "./player-input-any.js";
import { playerInputTogglePointerLock } from "./player-input-toggle-pointer-lock.js";
import { getPlayerInputDragging } from "./get-player-input-dragging.js";
import { playerInputOn } from "./player-input-on.js";
import { initializePlayerInput } from "./initialize-player-input.js";
export let playerInputController = class {
  constructor(context) {
    return initializePlayerInput.call(this, context);
  }
  _on(target, eventName, listener, options) {
    return playerInputOn.call(this, target, eventName, listener, options);
  }
  get dragging() {
    return getPlayerInputDragging.call(this);
  }
  togglePointerLock() {
    return playerInputTogglePointerLock.call(this);
  }
  any(codes) {
    return playerInputAny.call(this, codes);
  }
  anyPressed(codes) {
    return playerInputAnyPressed.call(this, codes);
  }
  poll(deltaTime) {
    return playerInputPoll.call(this, deltaTime);
  }
};
