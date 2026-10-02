import { isGameInputCaptured } from "../../core/input-capture.js";
import { createTownCamera } from "./camera.js";
import { routeTownInput } from "./input-routing.js";
import { exposeActiveTownPlayer } from "./active-player.js";
import { bindTownPicking } from "./picking.js";

export function createTownController(context, records, onChange) {
  const originalPlayer = context.player;
  let selectedId = null;
  const selected = () => records.get(selectedId) ?? null;
  const rig = createTownCamera(context, originalPlayer);
  const input = routeTownInput(context, selected);
  const restorePlayer = exposeActiveTownPlayer(context, originalPlayer, selected, rig);
  const listeners = new AbortController();
  function release(record) {
    if (!record) return;
    record.controlled = false;
    Object.assign(record.input, { mx: 0, mz: 0, run: false, jumpHeld: false, jumpPressed: false });
  }
  function select(id) {
    const next = records.get(id) ?? null;
    if (!next && selectedId === null) return;
    if (next && next.id === selectedId) return;
    release(selected());
    selectedId = next?.id ?? null;
    input.clear();
    rig.select(next);
    onChange();
  }
  function cycle() {
    const ids = [...records.keys()].sort();
    if (!ids.length) return context.hud?.toast("No active agents in town yet");
    select(ids[(ids.indexOf(selectedId) + 1) % ids.length]);
  }
  function toggleControl() {
    const record = selected();
    if (!record) return;
    record.controlled = !record.controlled;
    input.clear();
    onChange();
  }
  function toggleView() {
    rig.toggleFirstPerson();
    onChange();
  }
  function reconcileSelection() {
    if (selectedId && !selected()) select(null);
  }
  window.addEventListener(
    "keydown",
    (event) => {
      if (isGameInputCaptured(context, event)) return;
      if (event.repeat || event.target?.closest?.("input,textarea,select,[contenteditable=true]"))
        return;
      if (context.hud?.blocking || context.paused || context.petTown?.panel?.open) return;
      let action;
      // Standard voice recording holds Control+Option while gameplay continues.
      const recordingChord = event.ctrlKey && event.altKey;
      const gameplayModifiers =
        !event.metaKey && ((!event.altKey && !event.ctrlKey) || recordingChord);
      if (event.altKey && !event.ctrlKey && !event.metaKey && event.code === "KeyA") action = cycle;
      else if (gameplayModifiers && selected()) {
        if (event.code === "KeyC") action = toggleControl;
        if (event.code === "KeyV") action = toggleView;
        if (event.code === "Escape") action = () => select(null);
      }
      if (action) {
        event.preventDefault();
        event.stopImmediatePropagation();
        action();
      }
    },
    { capture: true, signal: listeners.signal },
  );
  window.addEventListener(
    "blur",
    () => {
      input.clear();
      const record = selected();
      if (record)
        Object.assign(record.input, { mx: 0, mz: 0, jumpHeld: false, jumpPressed: false });
    },
    { signal: listeners.signal },
  );
  const unbindPicking = bindTownPicking(context, records, select, originalPlayer.input);
  return {
    get selected() {
      return selected();
    },
    get firstPerson() {
      return rig.firstPerson;
    },
    select,
    cycle,
    toggleControl,
    toggleView,
    reconcileSelection,
    clearInput: () => input.clear(),
    followMayor() {
      select("pet-town-mayor");
    },
    beforeUpdate(deltaTime) {
      reconcileSelection();
      const record = selected();
      if (!record) return;
      const sample = input.sample;
      const movement = rig.movement(sample, deltaTime);
      if (record.controlled)
        Object.assign(record.input, movement, {
          run: !!sample.run,
          jumpHeld: !!sample.jumpHeld,
          jumpPressed: !!sample.jumpPressed,
        });
    },
    afterUpdate(deltaTime) {
      rig.update(deltaTime);
    },
    dispose() {
      release(selected());
      unbindPicking();
      listeners.abort();
      rig.dispose();
      input.dispose();
      restorePlayer();
    },
  };
}
