import "./companions.css";
import { createRosterRows } from "./roster-rows.js";

export function createCompanionPanel(controller, records, bridge, context) {
  const root = document.createElement("section");
  root.className = "town-companions";
  root.dataset.townUi = "companions";
  root.setAttribute("aria-label", "Companions");
  root.innerHTML = `
    <button type="button" class="town-roster-toggle" aria-expanded="false" aria-controls="town-roster-picker"><span>Companions · 0</span><kbd>⌥ A</kbd></button>
    <section id="town-roster-picker" class="town-list-panel" aria-label="Choose a companion" hidden>
      <header class="town-picker-head"><div><h2>Companions <span class="town-count">0</span></h2><p>Choose someone to follow.</p></div><button type="button" class="town-dismiss" aria-label="Close companions">×</button></header>
      <div class="town-roster" aria-label="Live companions"></div>
      <div class="town-empty" hidden><span aria-hidden="true">♧</span><h3>No companions yet</h3><p class="town-connection" role="status"></p></div>
      <footer class="town-picker-foot"><span><kbd>⌥ A</kbd> Cycle companions</span><button type="button" class="town-open-settings">Controls in <kbd>H</kbd></button></footer>
    </section>
    <p class="town-feedback" role="status" hidden></p>`;
  document.body.append(root);
  const el = (selector) => root.querySelector(selector);
  const toggle = el(".town-roster-toggle");
  const listeners = new AbortController();
  let open = false;
  let connection = { connected: false, message: "Connecting to Pet Town…" };
  let noticeUntil = 0;
  const renderRows = createRosterRows(
    el(".town-roster"),
    (id) => {
      if (!records.has(id)) return;
      controller.select(id);
      setOpen(false);
    },
    () => toggle.focus({ preventScroll: true }),
  );
  function setOpen(value, returnFocus = true) {
    open = value;
    controller.clearInput();
    if (open && document.pointerLockElement) document.exitPointerLock();
    render();
    if (returnFocus) {
      (open ? el(".town-dismiss") : toggle).focus({ preventScroll: true });
    }
  }
  function render() {
    toggle.querySelector("span").textContent = `Companions · ${records.size}`;
    toggle.setAttribute("aria-expanded", String(open));
    el(".town-list-panel").hidden = !open;
    el(".town-count").textContent = records.size;
    el(".town-empty").hidden = records.size > 0;
    el(".town-roster").hidden = !records.size;
    el(".town-empty h3").textContent = connection.connected
      ? "No companions yet"
      : "Town connection lost";
    el(".town-connection").textContent = connection.connected
      ? "Start work in a connected coding tool to bring companions into town."
      : connection.message;
    renderRows(records, controller.selected);
  }
  toggle.onclick = () => setOpen(!open);
  el(".town-dismiss").onclick = () => setOpen(false);
  el(".town-open-settings").onclick = () => {
    setOpen(false, false);
    context.hud?.toggleHelp(true);
  };
  for (const type of ["pointerdown", "mousedown", "click", "dblclick", "wheel"]) {
    root.addEventListener(type, (event) => event.stopPropagation(), { signal: listeners.signal });
  }
  root.addEventListener(
    "keydown",
    (event) => {
      if (["Space", "Enter"].includes(event.code)) event.stopPropagation();
    },
    { signal: listeners.signal },
  );
  window.addEventListener(
    "keydown",
    (event) => {
      if (!open) return;
      if (event.altKey && event.code === "KeyM") return;
      if (event.altKey && event.code === "KeyA") {
        if (!event.repeat) {
          controller.cycle();
          setOpen(false);
        }
      } else if (event.code === "Escape") setOpen(false);
      else if (event.code === "KeyH") {
        setOpen(false, false);
        context.hud?.toggleHelp(true);
      } else if (
        ["Tab", "Enter", "Space", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.code)
      ) {
        event.stopImmediatePropagation();
        return;
      }
      event.preventDefault();
      event.stopImmediatePropagation();
    },
    { capture: true, signal: listeners.signal },
  );
  window.addEventListener(
    "pointerdown",
    (event) => {
      if (!open || root.contains(event.target)) return;
      setOpen(false, false);
      if (event.target === context.canvas) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    },
    { capture: true, signal: listeners.signal },
  );
  return {
    get open() {
      return open;
    },
    close: () => setOpen(false, false),
    render,
    feedback(message) {
      el(".town-feedback").textContent = message;
      noticeUntil = performance.now() + 6500;
      el(".town-feedback").hidden = false;
    },
    setConnection(next) {
      connection = next;
      render();
    },
    update(context) {
      const underDialog = Boolean(context.hud?.helpOpen);
      root.inert = underDialog;
      root.dataset.underDialog = String(underDialog);
      root.hidden = !!(
        (context.hud?.blocking && !underDialog) ||
        context.hud?.hidden ||
        context.hud?.photoMode
      );
      if (root.hidden && open) setOpen(false, false);
      if (noticeUntil && performance.now() > noticeUntil) el(".town-feedback").hidden = true;
    },
    dispose() {
      listeners.abort();
      root.remove();
    },
  };
}
