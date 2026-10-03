import { isGameInputCaptured } from "../core/input-capture.js";
import { addPlayerInputFilter } from "../player/input/poll-filters.js";

export function createBoatInput(context, passengers) {
  const listeners = new AbortController();
  const held = new Set(),
    touch = new Set();
  let padAction = false,
    suppressPad = false;
  const blocked = () =>
    document.hidden ||
    !document.hasFocus() ||
    context.paused ||
    context.hud?.blocking ||
    context.hud?.photoMode ||
    context.petTown?.panel?.open ||
    context.petTown?.terminal?.inputActive ||
    context.worldAssets?.libraryOpen;
  function clear() {
    held.clear();
    touch.clear();
    padAction = true;
    suppressPad = true;
    for (const key of Object.keys(context.keys)) context.keys[key] = false;
    context.player.input.held.clear();
    context.player.input.pressed.clear();
  }
  window.addEventListener(
    "keydown",
    (event) => {
      if (
        blocked() ||
        isGameInputCaptured(context, event) ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        event.target?.closest?.("input,textarea,select,[contenteditable=true]")
      )
        return;
      if (event.repeat && !held.has(event.code)) return;
      held.add(event.code);
      if (event.code === "KeyF" && !event.repeat) {
        const action = passengers.action();
        if (!action) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        clear();
        action.run();
      }
    },
    { capture: true, signal: listeners.signal },
  );
  window.addEventListener("keyup", (event) => held.delete(event.code), {
    signal: listeners.signal,
  });
  window.addEventListener("blur", clear, { signal: listeners.signal });
  document.addEventListener("visibilitychange", clear, { signal: listeners.signal });
  const removeFilter = addPlayerInputFilter(context.player.input, (controls) => {
    if (!passengers.pilot) return controls;
    return {
      ...controls,
      x: 0,
      y: 0,
      run: false,
      jumpPressed: false,
      jumpHeld: false,
      diveHeld: false,
    };
  });
  const pressed = (...codes) => codes.some((code) => held.has(code) || touch.has(code));
  return {
    blocked,
    clear,
    touch,
    sample() {
      if (blocked()) {
        clear();
        return { throttle: 0, steering: 0, blocked: true };
      }
      let throttle = +pressed("KeyW", "ArrowUp") - +pressed("KeyS", "ArrowDown");
      let steering = +pressed("KeyD", "ArrowRight") - +pressed("KeyA", "ArrowLeft");
      const pad = Array.from(navigator.getGamepads?.() ?? []).find((p) => p?.connected);
      if (pad && suppressPad) {
        if (
          Math.abs(pad.axes[0] ?? 0) < 0.18 &&
          Math.abs(pad.axes[1] ?? 0) < 0.18 &&
          !pad.buttons[3]?.pressed
        )
          suppressPad = false;
        else return { throttle, steering, blocked: false };
      }
      if (pad) {
        const action = !!pad.buttons[3]?.pressed;
        if (action && !padAction) passengers.action()?.run();
        padAction = action;
        const x = pad.axes[0] ?? 0,
          y = pad.axes[1] ?? 0;
        if (Math.abs(y) > 0.18) throttle = -y;
        if (Math.abs(x) > 0.18) steering = x;
      }
      return { throttle, steering, blocked: false };
    },
    dispose() {
      clear();
      removeFilter();
      listeners.abort();
    },
  };
}
