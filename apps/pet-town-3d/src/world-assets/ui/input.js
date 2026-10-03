import { buildingState } from "../../building/state.js";
import { hudState } from "../../hud/state.js";
import { addPlayerInputFilter } from "../../player/input/poll-filters.js";

export function createLibraryInput(context, root, callbacks) {
  const listeners = new AbortController();
  const input = context.player.input;
  let active = false;
  let previousPaused;
  const dialog = root.querySelector('[role="dialog"]');
  const controls = () =>
    [...dialog.querySelectorAll("button,select,input,[tabindex]")].filter(
      (element) => !element.disabled && element.tabIndex >= 0 && element.getClientRects().length,
    );
  function clear() {
    context.petTown?.controller?.clearInput();
    buildingState.buildingMousePress = null;
    hudState.hudRuntime.touch?.releaseAll?.();
    input.held.clear();
    input.pressed.clear();
    input.drag = null;
    input.touches?.clear();
    input.orbitX = input.orbitY = input.zoom = input.pinch = 0;
    for (const key of Object.keys(context.keys)) context.keys[key] = false;
  }
  const removeInput = addPlayerInputFilter(input, (sample) =>
    active
      ? {
          ...sample,
          x: 0,
          y: 0,
          run: false,
          jumpHeld: false,
          jumpPressed: false,
          diveHeld: false,
          orbitX: 0,
          orbitY: 0,
          zoom: 0,
          rotate: 0,
        }
      : sample,
  );
  window.addEventListener(
    "keydown",
    (event) => {
      const modifier = event.metaKey || event.ctrlKey || event.altKey;
      if (!active) {
        if (event.code !== "KeyK" || modifier || event.repeat || !callbacks.available()) return;
        if (
          event.target?.closest?.(
            "input,textarea,select,[contenteditable=true],[data-town-ui=terminal]",
          )
        )
          return;
        event.preventDefault();
        event.stopImmediatePropagation();
        callbacks.toggle();
        return;
      }
      event.stopImmediatePropagation();
      if (event.code === "Escape" || (!modifier && event.code === "KeyK")) {
        event.preventDefault();
        if (!event.repeat) callbacks.close();
      } else if (!modifier && ["KeyH", "KeyP"].includes(event.code)) {
        event.preventDefault();
        if (!event.repeat) callbacks.handoff(event.code);
      } else if (event.code === "Tab") {
        event.preventDefault();
        const items = controls();
        const index = items.indexOf(document.activeElement);
        items[(index + (event.shiftKey ? -1 : 1) + items.length) % items.length]?.focus();
      } else if (dialog.contains(event.target) && event.target.matches("input,select")) {
        // Keep native range arrows and select operation without leaking game shortcuts.
        if (modifier && ["KeyZ", "KeyY"].includes(event.code)) event.preventDefault();
      } else if (
        ["Space", "Enter", "NumpadEnter"].includes(event.code) &&
        event.target.matches("button")
      ) {
        event.preventDefault();
        if (!event.repeat) event.target.click();
      } else event.preventDefault();
    },
    { capture: true, signal: listeners.signal },
  );
  window.addEventListener(
    "keyup",
    (event) => {
      if (active) {
        event.stopImmediatePropagation();
        input.held.delete(event.code);
      }
    },
    { capture: true, signal: listeners.signal },
  );
  document.addEventListener(
    "focusin",
    (event) => {
      if (active && !dialog.contains(event.target)) controls()[0]?.focus();
    },
    { signal: listeners.signal },
  );
  window.addEventListener(
    "blur",
    () => {
      if (active) {
        clear();
        callbacks.close(false);
      }
    },
    { signal: listeners.signal },
  );
  document.addEventListener(
    "visibilitychange",
    () => {
      if (document.hidden && active) {
        clear();
        callbacks.close(false);
      }
    },
    { signal: listeners.signal },
  );
  const pointerEvents = [
    "pointerdown",
    "pointermove",
    "pointerup",
    "pointercancel",
    "mousedown",
    "mouseup",
    "click",
  ];
  for (const type of pointerEvents) {
    root.addEventListener(type, (event) => event.stopPropagation(), { signal: listeners.signal });
    window.addEventListener(
      type,
      (event) => {
        if (active && !root.contains(event.target)) {
          event.stopImmediatePropagation();
          event.preventDefault();
        }
      },
      { capture: true, signal: listeners.signal },
    );
  }
  window.addEventListener(
    "wheel",
    (event) => {
      if (!active) return;
      event.stopImmediatePropagation();
      if (!dialog.contains(event.target)) event.preventDefault();
    },
    { capture: true, passive: false, signal: listeners.signal },
  );
  return {
    setActive(value) {
      if (active === value) return;
      active = value;
      clear();
      if (value) {
        previousPaused = context.paused;
        context.paused = true;
        document.exitPointerLock?.();
        context.petTown?.terminal?.blur();
      } else if (context.paused === true) context.paused = previousPaused;
    },
    dispose() {
      this.setActive(false);
      listeners.abort();
      removeInput();
    },
  };
}
