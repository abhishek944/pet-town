import { createUsageView } from "./view.js";

/** Read native counters independently of selection; following only changes presentation. */
export function createTownUsage(controller) {
  const view = createUsageView();
  let usage = null;
  let connected = false;
  let lastRender = "";
  function render(force = false) {
    const selected = controller.selected;
    const key = JSON.stringify([selected?.id, selected?.label, selected?.source, connected]);
    if (!force && key === lastRender) return;
    lastRender = key;
    view.render(usage, selected, connected);
  }
  return {
    setSnapshot(snapshot) {
      usage = snapshot?.usage ?? null;
      render(true);
    },
    setConnection(connection) {
      connected = connection.connected;
      if (!connected) usage = null;
      render(true);
    },
    update(context) {
      view.root.hidden = Boolean(
        !window.__TAURI_INTERNALS__ ||
        context.hud?.blocking ||
        context.hud?.helpOpen ||
        context.hud?.hidden ||
        context.hud?.photoMode ||
        context.petTown?.panel?.open,
      );
      render();
    },
    dispose: () => view.dispose(),
  };
}
