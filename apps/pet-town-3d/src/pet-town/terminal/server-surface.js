import { createSurfaceQueue } from "./surface-queue.js";
import { bindServerPaste } from "./paste.js";

/** Herdr owns history and original mouse modes; xterm only displays its cell blits. */
export function createServerSurface(
  view,
  terminal,
  { enabled, send, onFailure, onNotice, onLayout },
) {
  const listeners = new AbortController(),
    viewport = view.fields.viewport;
  const queue = createSurfaceQueue(send, enabled, onFailure);
  const state = {
    history: false,
    originalGrid: view.controls.grid.getAttribute("aria-pressed") === "true",
  };
  let gesture = null,
    revision = 0,
    disposed = false;
  const modifiers = (event) =>
    (event.shiftKey ? 1 : 0) | (event.ctrlKey ? 2 : 0) | (event.altKey ? 4 : 0);
  function position(event, clamp = false) {
    const rect = view.fields.screen.querySelector(".xterm-screen")?.getBoundingClientRect();
    if (!rect?.width || !rect.height) return null;
    const column = Math.floor(((event.clientX - rect.left) * terminal.cols) / rect.width);
    const row = Math.floor(((event.clientY - rect.top) * terminal.rows) / rect.height);
    if (!clamp && (column < 0 || row < 0 || column >= terminal.cols || row >= terminal.rows))
      return null;
    return {
      column: Math.max(0, Math.min(terminal.cols - 1, column)),
      row: Math.max(0, Math.min(terminal.rows - 1, row)),
    };
  }
  function mouse(action, event, at) {
    queue.enqueue(
      {
        type: "terminal.mouse",
        action,
        button: gesture.button,
        ...at,
        modifiers: modifiers(event),
      },
      action !== "drag",
    );
  }
  viewport.addEventListener(
    "wheel",
    (event) => {
      if (!event.deltaY || event.shiftKey) return;
      event.preventDefault();
      event.stopPropagation();
      if (!enabled()) {
        onNotice("Interact to scroll Herdr history. Watching shows the current server view.");
        return;
      }
      const units = event.deltaMode === 1 ? 1 : event.deltaMode === 2 ? terminal.rows : 1 / 20;
      const lines = Math.min(2048, Math.max(1, Math.round(Math.abs(event.deltaY) * units)));
      revision++;
      if (event.deltaY < 0) state.history = true;
      queue.enqueue({
        type: "terminal.scroll",
        direction: event.deltaY < 0 ? "up" : "down",
        lines,
        ...position(event, true),
        modifiers: modifiers(event),
      });
      onLayout();
    },
    { capture: true, passive: false, signal: listeners.signal },
  );
  viewport.addEventListener(
    "pointerdown",
    (event) => {
      if (!enabled() || event.shiftKey || gesture || event.pointerType !== "mouse") return;
      const at = position(event),
        button = ["left", "middle", "right"][event.button];
      if (!at || !button) return;
      event.preventDefault();
      event.stopPropagation();
      terminal.focus();
      gesture = { pointerId: event.pointerId, button, at };
      viewport.setPointerCapture(event.pointerId);
      mouse("down", event, at);
    },
    { capture: true, signal: listeners.signal },
  );
  viewport.addEventListener(
    "pointermove",
    (event) => {
      if (
        !gesture ||
        gesture.pointerId !== event.pointerId ||
        !enabled() ||
        !event.buttons ||
        event.shiftKey
      )
        return;
      event.preventDefault();
      event.stopPropagation();
      gesture.at = position(event, true) || gesture.at;
      mouse("drag", event, gesture.at);
    },
    { capture: true, signal: listeners.signal },
  );
  function finish(event) {
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    if (enabled()) mouse("up", event, position(event, true) || gesture.at);
    if (viewport.hasPointerCapture(event.pointerId))
      viewport.releasePointerCapture(event.pointerId);
    gesture = null;
  }
  viewport.addEventListener("pointerup", finish, { capture: true, signal: listeners.signal });
  viewport.addEventListener("pointercancel", finish, { capture: true, signal: listeners.signal });
  viewport.addEventListener(
    "contextmenu",
    (event) => {
      if (enabled() && !event.shiftKey) event.preventDefault();
    },
    { signal: listeners.signal },
  );
  bindServerPaste(
    view.fields.screen,
    {
      enabled,
      send,
      onNotice,
      onSubmit() {
        const current = revision;
        return () => {
          if (disposed || current !== revision) return;
          state.history = false;
          viewport.scrollTop = 0;
          onLayout();
        };
      },
    },
    listeners.signal,
  );
  view.controls.grid.addEventListener(
    "click",
    () => {
      state.originalGrid = !state.originalGrid;
      view.controls.grid.setAttribute("aria-pressed", String(state.originalGrid));
      viewport.scrollTop = 0;
      onLayout();
    },
    { signal: listeners.signal },
  );
  view.controls.live.addEventListener(
    "click",
    async () => {
      if (!enabled()) return;
      queue.clear();
      const current = revision;
      if (await send({ type: "terminal.live" })) {
        if (disposed || current !== revision) return;
        state.history = false;
        viewport.scrollTop = 0;
        onLayout();
      }
    },
    { signal: listeners.signal },
  );
  return {
    state,
    reset() {
      queue.clear();
      if (gesture && viewport.hasPointerCapture(gesture.pointerId))
        viewport.releasePointerCapture(gesture.pointerId);
      gesture = null;
      view.controls.live.disabled = !enabled();
    },
    dispose() {
      disposed = true;
      if (gesture && viewport.hasPointerCapture(gesture.pointerId))
        viewport.releasePointerCapture(gesture.pointerId);
      listeners.abort();
      queue.dispose();
      gesture = null;
    },
  };
}
