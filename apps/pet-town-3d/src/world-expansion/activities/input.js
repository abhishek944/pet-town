import { buildingState } from "../../building/state.js";
import { hudState } from "../../hud/state.js";
import { addPlayerInputFilter } from "../../player/input/poll-filters.js";

/** Journal input ownership is local and reversible, including companion/gamepad input. */
export function createJournalInput(context, root, callbacks) {
  const listeners = new AbortController();
  const input = context.player.input;
  let active = false;
  let previousPaused;
  function clear() {
    context.petTown?.controller.clearInput();
    buildingState.buildingMousePress = null;
    hudState.hudRuntime.touch?.releaseAll?.();
    input.held.clear();
    input.pressed.clear();
    input.drag = null;
    input.touches?.clear();
    input.orbitX = input.orbitY = input.zoom = input.pinch = 0;
    for (const key of Object.keys(context.keys)) context.keys[key] = false;
  }
  const journalPoll = function (controls) {
    if (!active) return controls;
    return {
      ...controls,
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
    };
  };
  const removeInput = addPlayerInputFilter(input, journalPoll);
  window.addEventListener(
    "keydown",
    (event) => {
      const modifier = event.metaKey || event.ctrlKey || event.altKey;
      if (!active) {
        if (event.code !== "KeyJ" || event.repeat || modifier || !callbacks.available()) return;
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
      if (!modifier && ["KeyH", "KeyP"].includes(event.code)) {
        callbacks.close();
        return;
      }
      event.stopImmediatePropagation();
      if (!modifier && callbacks.key?.(event)) {
        event.preventDefault();
      } else if (event.code === "Escape" || (!modifier && event.code === "KeyJ")) {
        event.preventDefault();
        if (!event.repeat) callbacks.close();
      } else if (event.code === "Tab") {
        event.preventDefault();
        const buttons = [...root.querySelectorAll("[data-trail-dialog] button")].filter(
          (item) => !item.disabled && !item.closest("[hidden]") && item.tabIndex !== -1,
        );
        const index = buttons.indexOf(document.activeElement);
        const next =
          index < 0
            ? event.shiftKey
              ? buttons.length - 1
              : 0
            : (index + (event.shiftKey ? -1 : 1) + buttons.length) % buttons.length;
        buttons[next]?.focus();
      } else if (
        ["Enter", "Space"].includes(event.code) &&
        document.activeElement?.matches("button") &&
        root.contains(document.activeElement)
      ) {
        event.preventDefault();
        if (!event.repeat) document.activeElement.click();
      } else {
        event.preventDefault();
      }
    },
    { capture: true, signal: listeners.signal },
  );
  window.addEventListener(
    "keyup",
    (event) => {
      if (!active) return;
      event.stopImmediatePropagation();
      input.held.delete(event.code);
    },
    { capture: true, signal: listeners.signal },
  );
  for (const type of ["pointerdown", "pointermove", "mousedown", "mouseup", "click", "wheel"]) {
    root.addEventListener(type, (event) => event.stopPropagation(), { signal: listeners.signal });
  }
  window.addEventListener(
    "wheel",
    (event) => {
      if (!active || event.target?.closest?.('[data-town-ui="terminal"]')) return;
      event.stopImmediatePropagation();
      if (!event.target?.closest?.("[data-trail-dialog]")) event.preventDefault();
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
        context.petTown?.terminal.blur();
      } else if (context.paused === true) context.paused = previousPaused;
    },
    dispose() {
      this.setActive(false);
      listeners.abort();
      removeInput();
    },
  };
}
