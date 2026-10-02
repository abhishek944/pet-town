import "./mayor.css";
import { createPortrait } from "../ui/portrait.js";

export function createMayorView() {
  const root = document.createElement("section");
  root.className = "pt-mayor";
  root.hidden = true;
  root.dataset.townUi = "mayor";
  root.setAttribute("aria-label", "Mayor voice controls");
  root.innerHTML = `
    <header class="pt-mayor__header">
      <button type="button" data-control="follow" title="Call Mayor (Option+M)" aria-label="Call Mayor">
        <span class="pt-mayor__badge" aria-hidden="true"></span>
        <span class="pt-mayor__identity"><strong data-field="name">Mayor</strong><small data-field="phase" role="status" aria-live="polite">Connecting…</small></span>
      </button>
      <button type="button" class="pt-mayor__wave" data-control="expand" aria-expanded="true" aria-label="Collapse Mayor controls" title="Collapse Mayor controls"><i></i><i></i><i></i><i></i><i></i></button>
    </header>
    <div class="pt-mayor__body" data-field="body">
      <p class="pt-mayor__status" data-field="status" role="status" aria-live="polite"></p>
      <p class="pt-mayor__error" data-field="error" role="alert" hidden></p>
      <blockquote class="pt-mayor__speech" data-field="speech" aria-live="polite" hidden></blockquote>
      <div class="pt-mayor__actions">
        <button type="button" class="pt-mayor__primary" data-control="talk">Start talking</button>
        <button type="button" class="pt-mayor__primary" data-control="stop">Stop voice</button>
        <select data-control="mode" aria-label="Mayor voice mode"><option value="firstmate">Standard mode</option><option value="live">Live mode</option></select>
        <button type="button" data-control="settings" title="Mayor settings" aria-label="Mayor settings">⚙</button>
      </div>
      <div class="pt-mayor__recovery"><button type="button" data-control="retry">Retry voice</button><button type="button" data-control="reconnect" hidden>Retry connection</button></div>
      <p class="pt-mayor__hint" data-field="hint"></p>
    </div>`;
  root
    .querySelector(".pt-mayor__badge")
    .append(createPortrait({ id: "pet-town-mayor", isMayor: true }));
  const fields = {};
  const controls = {};
  for (const element of root.querySelectorAll("[data-field]"))
    fields[element.dataset.field] = element;
  for (const element of root.querySelectorAll("[data-control]"))
    controls[element.dataset.control] = element;
  const abort = new AbortController();
  for (const type of ["pointerdown", "mousedown", "click", "dblclick", "wheel", "keydown"]) {
    root.addEventListener(type, (event) => event.stopPropagation(), { signal: abort.signal });
  }
  root.addEventListener(
    "click",
    (event) => {
      const button = event.target.closest("button");
      if (event.detail > 0 || button !== controls.expand) button?.blur();
    },
    { signal: abort.signal },
  );
  function expand(value = true) {
    fields.body.hidden = !value;
    controls.expand.setAttribute("aria-expanded", String(value));
    const label = `${value ? "Collapse" : "Expand"} Mayor controls`;
    controls.expand.setAttribute("aria-label", label);
    controls.expand.title = label;
  }
  controls.expand.addEventListener("click", () => expand(fields.body.hidden), {
    signal: abort.signal,
  });
  document.body.append(root);
  return {
    root,
    fields,
    controls,
    expand,
    onModeCommit(callback) {
      // Native menus can consume Enter; change is the reliable selection event.
      controls.mode.addEventListener(
        "change",
        () => {
          const mode = controls.mode.value;
          controls.mode.blur();
          callback(mode);
        },
        { signal: abort.signal },
      );
    },
    dispose() {
      abort.abort();
      root.remove();
    },
  };
}
