import { createTerminalView } from "./view.js";
import { createTerminalRenderer } from "./renderer.js";
import { createTerminalSession } from "./session.js";
import { bindDockListeners } from "./dock-listeners.js";

export function createTerminalDock({ context, controller, bridge, onVisibility }) {
  const view = createTerminalView(),
    listeners = new AbortController();
  let record = null,
    selectedId = null,
    suppressed = null,
    disposed = false;
  let visible = false,
    suspended = false,
    renderer = null,
    focused = false;
  let ownsControl = false,
    requestedControl = true;
  function clearFocus() {
    focused = false;
    controller.clearInput?.();
    renderer?.blur();
    if (view.root.contains(document.activeElement)) document.activeElement.blur?.();
  }
  function status(next, control, message) {
    ownsControl = control && next === "ready";
    renderer?.setInput(ownsControl);
    view.status(next, control, message);
    if (!ownsControl) clearFocus();
    else renderer?.refresh();
  }
  const session = createTerminalSession({
    onEvent(event) {
      if (disposed) return;
      if (event.type === "frame") renderer?.frame(event);
      else if (event.type === "status") status(event.state, event.control, event.message);
    },
    onError(message) {
      status("disconnected", false, "Input stopped. Reconnect before typing.");
      view.error(message);
    },
  });
  function setVisible(value) {
    view.root.hidden = !value;
    if (visible === value) return;
    visible = value;
    onVisibility?.(value);
  }
  function makeRenderer() {
    renderer?.dispose();
    view.fields.screen.replaceChildren();
    renderer = createTerminalRenderer(view, {
      onInput: (text) => {
        if (ownsControl && focused) session.input(text);
      },
      onCommand: (command) => session.send(command),
      onNotice: (message) => view.error(message),
      onResize: (size) => {
        if (ownsControl) session.resize(size);
      },
      onFailure(message) {
        session.close();
        status("disconnected", false, message);
        view.error(message);
      },
    });
  }
  function attach(control = requestedControl, takeover = false) {
    if (!record || disposed || suspended) return;
    requestedControl = control;
    view.error("");
    clearFocus();
    makeRenderer();
    void session.attach(record.id, renderer.dimensions(), control, takeover);
  }
  function close() {
    if (record) suppressed = record.id;
    session.close();
    clearFocus();
    renderer?.dispose();
    renderer = null;
    record = null;
    setVisible(false);
    status("closed", false, "Terminal view closed");
  }
  async function external() {
    if (!record) return;
    try {
      await bridge.action("focusAgent", { id: record.id });
    } catch (error) {
      if (!disposed) view.error(String(error));
    }
  }
  function release() {
    if (!record || disposed) return;
    session.close();
    clearFocus();
    status("disconnected", false, "Terminal view paused. Reconnect to resume.");
  }
  bindDockListeners(
    view,
    {
      clearFocus,
      clearInput: () => controller.clearInput?.(),
      setFocus: (value) => {
        focused = value;
      },
      canInput: () => ownsControl,
      focusTerminal: () => renderer?.focus(),
      attach,
      close,
      external,
      release,
    },
    listeners.signal,
  );
  return {
    get open() {
      return visible;
    },
    get inputActive() {
      return visible && !view.root.inert && (focused || view.root.contains(document.activeElement));
    },
    update(next, currentContext = context) {
      if (disposed) return;
      context = currentContext;
      const eligible = next?.source === "herdr" && next.supportsTerminal === true && !next.isMayor;
      const id = eligible ? next.id : null;
      if (id !== selectedId) {
        selectedId = id;
        suppressed = null;
        session.close();
        clearFocus();
        renderer?.dispose();
        renderer = null;
        record = null;
        requestedControl = true;
      }
      if (!eligible || suppressed === id) {
        setVisible(false);
        return;
      }
      const first = !record;
      record = next;
      view.identity(next);
      const hidden = Boolean(
        document.hidden ||
        context.hud?.blocking ||
        context.hud?.helpOpen ||
        context.hud?.hidden ||
        context.hud?.photoMode,
      );
      view.root.inert = hidden;
      view.root.dataset.suspended = String(hidden);
      setVisible(!hidden);
      if (hidden && !suspended) {
        suspended = true;
        release();
      } else if (!hidden && suspended) {
        suspended = false;
        attach(false);
      } else if (first && !hidden) attach(true);
    },
    close,
    blur: clearFocus,
    dispose() {
      if (disposed) return;
      close();
      disposed = true;
      listeners.abort();
      view.dispose();
      return session.dispose();
    },
  };
}
