import { createMayorView } from "./view.js";
import { renderMayorView } from "./render.js";
import { createMayorTalk } from "./talk.js";
import { createMayorSpeech } from "./speech.js";

export function createMayorPanel({ bridge, onFollowMayor }) {
  const view = createMayorView();
  const speech = createMayorSpeech();
  const state = {
    snapshot: null,
    connection: { connected: false, message: "Connecting to Pet Town…" },
    pending: "",
    error: "",
    ownsTalk: false,
    releasingTalk: false,
  };
  const abort = new AbortController();
  let disposed = false;
  const render = () => {
    if (disposed) return;
    // Snapshot polling must not overwrite an option being chosen with the keyboard.
    const editingMode = document.activeElement === view.controls.mode;
    const chosenMode = view.controls.mode.value;
    renderMayorView(view, state);
    if (editingMode) view.controls.mode.value = chosenMode;
  };
  const talk = createMayorTalk(bridge, state, render);

  async function run(message, operation) {
    if (disposed || state.pending) return;
    state.pending = message;
    state.error = "";
    render();
    try {
      await operation();
    } catch (error) {
      state.error = String(error);
      if (!disposed) view.expand();
    } finally {
      state.pending = "";
      render();
    }
  }

  function releaseOnBlur() {
    void talk.release().catch((error) => {
      state.error = String(error);
      render();
    });
  }
  function callMayor() {
    onFollowMayor?.();
    void run("Calling Mayor…", () => bridge.action("invokeMayor"));
  }
  function onShortcut(event) {
    if (document.querySelector(".asset-library-overlay:not([hidden])")) return;
    if (event.target?.closest?.('[data-town-ui="terminal"]')) return;
    if (event.code !== "KeyM" || !event.altKey || event.ctrlKey || event.metaKey) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (!event.repeat) callMayor();
  }
  const { controls } = view;
  const listen = (element, event, callback) =>
    element.addEventListener(event, callback, { signal: abort.signal });
  listen(controls.follow, "click", callMayor);
  listen(controls.talk, "click", () => {
    if (state.snapshot?.mode === "live") return callMayor();
    const listening = state.ownsTalk || state.snapshot?.mayor?.listening;
    void run(listening ? "Sending recording…" : "Starting microphone…", () =>
      listening ? talk.release(true) : talk.start(),
    );
  });
  listen(controls.stop, "click", () => {
    void run("Stopping voice…", () => bridge.action("stopMayor"));
  });
  listen(controls.retry, "click", () => {
    void run("Retrying Mayor's voice…", () => bridge.action("mayorRetryVoice"));
  });
  listen(controls.settings, "click", () => {
    void run("Opening Mayor settings…", () => bridge.action("openMayorSettings"));
  });
  listen(controls.reconnect, "click", () => {
    void run("Connecting to Pet Town…", () => bridge.start());
  });
  view.onModeCommit((mode) => {
    if (mode === state.snapshot?.mode) return;
    void run("Changing voice mode…", async () => {
      await talk.release();
      await bridge.action("setMayorMode", { mode });
    });
  });
  listen(window, "blur", releaseOnBlur);
  listen(document, "visibilitychange", () => {
    if (document.hidden) releaseOnBlur();
  });
  window.addEventListener("keydown", onShortcut, { capture: true, signal: abort.signal });
  render();

  return {
    setSnapshot(snapshot) {
      if (disposed) return;
      if (snapshot?.mayor?.speech && snapshot.mayor.speech !== state.snapshot?.mayor?.speech) {
        view.expand();
      }
      if (
        snapshot?.mode === "live" &&
        snapshot.mayor?.degradedNote &&
        snapshot.mayor.degradedNote !== state.snapshot?.mayor?.degradedNote
      ) {
        view.expand();
      }
      state.snapshot = snapshot;
      if (snapshot) state.connection.connected = true;
      void talk.observe(snapshot?.mayor).catch((error) => {
        state.error = String(error);
        if (!disposed) view.expand();
        render();
      });
      render();
    },
    setConnection(connection) {
      if (disposed) return;
      state.connection = connection;
      if (!connection.connected) {
        releaseOnBlur();
        state.snapshot = null;
      }
      render();
    },
    update(deltaTime, context, mayorRecord) {
      const underDialog = Boolean(context.hud?.helpOpen || context.worldAssets?.libraryOpen);
      view.root.inert = underDialog;
      view.root.dataset.underDialog = String(underDialog);
      const uiHidden = Boolean(
        (context.hud?.blocking && !underDialog) || context.hud?.hidden || context.hud?.photoMode,
      );
      view.root.hidden = uiHidden || !context.petTown?.controller.selected?.isMayor;
      speech.update(
        deltaTime,
        context,
        mayorRecord,
        state.snapshot?.mayor,
        uiHidden || underDialog,
      );
    },
    dispose() {
      disposed = true;
      abort.abort();
      view.dispose();
      speech.dispose();
      return talk.release().catch(() => {});
    },
  };
}
