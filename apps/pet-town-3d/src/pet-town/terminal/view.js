import "@xterm/xterm/css/xterm.css";
import "./terminal.css";
import { createPortrait, companionStatus } from "../ui/portrait.js";
import { createDockProfile } from "./profile.js";

export function createTerminalView() {
  const root = document.createElement("aside");
  root.className = "pt-terminal";
  root.dataset.townUi = "terminal";
  root.hidden = true;
  root.setAttribute("aria-label", "Companion details");
  root.innerHTML = `
    <header class="pt-terminal__head">
      <div data-field="portrait"></div>
      <div class="pt-terminal__identity"><h2 data-field="name"></h2>
        <p><span data-field="source"></span> <span data-field="provider"></span> <span class="pt-terminal__badge" data-field="connection" hidden>Connecting</span></p></div>
      <button class="pt-terminal__icon" data-control="external" aria-label="Open in Herdr" title="Open in Herdr">↗</button>
      <button class="pt-terminal__icon" data-control="close" aria-label="Close companion panel" title="Close companion panel">×</button>
    </header>
    <section class="pt-terminal__task"><span class="pt-terminal__state" data-field="phase"></span><strong data-field="task" hidden></strong></section>
    <button class="pt-terminal__back" data-control="back" hidden>← Back to companion</button>
    <section class="pt-terminal__frame" data-field="frame" hidden>
      <div class="pt-terminal__top"><span>⌁ &nbsp; Terminal</span><button data-control="grid" class="pt-terminal__grid" aria-pressed="false" title="Keep the original grid for full-screen apps. Herdr does not report the original terminal mode.">Original grid</button><span data-field="mode">Connecting</span></div>
      <div class="pt-terminal__viewport" data-field="viewport"><div class="pt-terminal__screen" data-field="screen"></div></div>
      <button class="pt-terminal__live" data-control="live" hidden>Return to live output</button>
    </section>
    <div class="pt-terminal__strip" data-field="strip" hidden><div><strong data-field="control"></strong><small data-field="hint"></small></div>
      <button data-control="watch">Back to watching</button><button data-control="interact" hidden>Interact</button>
      <button data-control="takeover" hidden>Take over input</button><button data-control="retry" hidden>Reconnect</button></div>
    <p class="pt-terminal__error" data-field="error" role="alert" hidden></p>
    <footer class="pt-terminal__foot" data-field="foot" hidden><span data-field="status" role="status" aria-live="polite">Connecting to the existing session</span>
      <button data-control="open">Open in Herdr ↗</button></footer>`;
  const fields = {},
    controls = {};
  for (const element of root.querySelectorAll("[data-field]"))
    fields[element.dataset.field] = element;
  for (const element of root.querySelectorAll("[data-control]"))
    controls[element.dataset.control] = element;
  for (const button of root.querySelectorAll("button")) button.type = "button";
  document.body.append(root);
  const profile = createDockProfile(root);
  let recordId;
  return {
    root,
    fields,
    controls,
    profile,
    showTerminal(value) {
      root.dataset.view = value ? "terminal" : "profile";
      profile.root.hidden = value;
      for (const name of ["frame", "strip", "foot", "connection"]) fields[name].hidden = !value;
      controls.back.hidden = !value;
    },
    identity(record, controller) {
      const key = `${record.id}:${record.petId ?? ""}`;
      if (recordId !== key) {
        recordId = key;
        fields.portrait.replaceChildren(createPortrait(record));
      }
      profile.render(record, controller);
      fields.name.textContent = record.label || "Companion";
      const source = record.source === "herdr" ? "Herdr" : record.source || "Agent";
      fields.source.textContent = source;
      for (const name of ["external", "open"]) {
        controls[name].setAttribute("aria-label", `Open in ${source}`);
        controls[name].title = `Open in ${source}`;
      }
      controls.open.textContent = `Open in ${source} ↗`;
      fields.provider.textContent = record.provider ? `· ${record.provider}` : "";
      fields.phase.textContent = companionStatus(record);
      fields.phase.dataset.phase = record.status;
      fields.task.textContent = record.task || record.activity || "";
      fields.task.hidden = !fields.task.textContent;
      root.setAttribute("aria-label", `${record.label || "Companion"} companion panel`);
    },
    status(state, control, message = "") {
      const ready = state === "ready",
        conflict = state === "conflict";
      fields.connection.textContent = ready
        ? "Connected"
        : state === "connecting"
          ? "Connecting"
          : "Offline";
      fields.mode.textContent =
        ready && control ? "● Terminal input on" : ready ? "Watching" : "Input off";
      fields.control.textContent = conflict
        ? "Another window controls input"
        : ready && control
          ? "Terminal input is on"
          : "Watching the terminal";
      fields.hint.textContent = conflict
        ? "Take over only when you want to move control here."
        : ready && control
          ? "Shift selects text. Use Original grid for full-screen apps."
          : "Interact to scroll history. The existing agent keeps running.";
      fields.status.textContent =
        message || (ready ? "Watching the same session" : "Connecting to the existing session");
      controls.watch.hidden = !control && !conflict;
      controls.watch.disabled = state === "connecting";
      controls.interact.hidden = !ready || control;
      controls.takeover.hidden = !conflict;
      controls.retry.hidden = ready || conflict || state === "connecting";
      root.dataset.control = String(ready && control);
    },
    error(message) {
      fields.error.textContent = message;
      fields.error.hidden = !message;
    },
    dispose() {
      root.remove();
    },
  };
}
