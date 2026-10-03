import { toggleHudHelp } from "../modals/toggle-hud-help.js";
import { hudState } from "../state.js";

const focusKeys = new Set(["Tab", "ArrowLeft", "ArrowRight", "Home", "End"]);

export function createUpdateInteractionGuard(root, showAbout, refreshTown) {
  let locked = false;
  let resetFocus = null;
  const previousDisabled = new Map();

  function controls() {
    return [
      ...root.querySelectorAll("button, select, input, textarea"),
      ...(hudState.hudElements.confirm?.querySelectorAll("button, select, input, textarea") ?? []),
    ];
  }

  function sync() {
    if (!locked) return;
    for (const control of controls()) {
      if (control.matches('[role="tab"]')) continue;
      if (!previousDisabled.has(control)) previousDisabled.set(control, control.disabled);
      control.disabled = true;
    }
  }

  function setLocked(next) {
    if (locked === next) return sync();
    locked = next;
    if (locked) {
      if (hudState.hudRuntime.confirm) {
        resetFocus = document.activeElement;
      } else {
        if (!hudState.hudRuntime.help) toggleHudHelp(true, true);
        showAbout();
      }
      sync();
    } else {
      for (const [control, disabled] of previousDisabled) control.disabled = disabled;
      previousDisabled.clear();
      if (hudState.hudRuntime.confirm && resetFocus?.isConnected) resetFocus.focus();
      resetFocus = null;
      refreshTown();
    }
  }

  window.addEventListener(
    "keydown",
    (event) => {
      if (!locked || (!hudState.hudRuntime.confirm && focusKeys.has(event.code))) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    },
    true,
  );

  return {
    get locked() {
      return locked;
    },
    setLocked,
    sync,
    keepOpen() {
      if (!hudState.hudRuntime.confirm) toggleHudHelp(true, true);
    },
  };
}
