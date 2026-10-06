import type { Context } from "./types";
export function text(root: HTMLElement, selector: string, value: string): void {
  root.querySelectorAll<HTMLElement>(selector).forEach((el) => (el.textContent = value));
}
export function dependencyView(root: HTMLElement, ctx: Context): void {
  const d = ctx.dependency;
  const titles: Record<string, string> = {
    checking: "Checking this Mac…",
    missing: "Herdr isn’t installed yet",
    notReady: "Herdr needs one more step",
    ready: "Herdr is ready",
    downloading: "Downloading Herdr…",
    verifying: "Verifying Herdr…",
    error: "Setup needs a little help",
  };
  root.querySelector<HTMLElement>("[data-host]")?.setAttribute("data-state", d.phase);
  text(root, "[data-status-title]", titles[d.phase] ?? "Setting up Herdr…");
  text(root, "[data-status-copy]", d.message);
  text(
    root,
    "[data-install-action]",
    d.phase === "missing"
      ? "Install Herdr"
      : d.phase === "ready"
        ? "Continue →"
        : d.phase === "notReady"
          ? "Open Herdr →"
          : "Check again →",
  );
  text(
    root,
    "[data-install-detail]",
    d.version
      ? `${d.version} · Your existing installation stays in place.`
      : "Installation starts when you choose Install Herdr.",
  );
}
export function toolView(root: HTMLElement, ctx: Context): void {
  for (const button of root.querySelectorAll<HTMLButtonElement>("[data-tool]")) {
    const tool = ctx.tools.find((t) => t.id === button.dataset.tool);
    button.hidden = tool?.status === "unsupported";
    button.setAttribute("aria-pressed", String(button.dataset.tool === ctx.tool));
    text(
      button,
      "small",
      tool?.status === "found"
        ? "Found on this Mac"
        : tool?.status === "missing"
          ? "Set up"
          : "Checking…",
    );
  }
  const selected = ctx.tools.find((t) => t.id === ctx.tool);
  text(
    root,
    "[data-check-tool]",
    selected
      ? selected.status === "found" && selected.readiness !== "signIn"
        ? `Use ${selected.label} →`
        : selected.readiness === "signIn"
          ? `Sign in to ${selected.label} →`
          : `Set up ${selected.label} →`
      : "Choose a coding tool",
  );
  const primary = root.querySelector<HTMLButtonElement>("[data-check-tool]");
  if (primary) primary.disabled = !selected || selected.status === "unsupported";
  text(
    root,
    "[data-check-title]",
    selected?.readiness === "ready" ? "Sign-in checked" : "Before your first agent",
  );
  text(
    root,
    "[data-check-copy]",
    selected?.message ?? "Choose a tool to check its installation and sign-in.",
  );
  const panel = root.querySelector<HTMLElement>(".check-panel");
  if (panel) panel.classList.toggle("show-check", Boolean(selected));
  text(
    root,
    ".ready-note",
    ctx.dependency.phase === "ready"
      ? "Herdr is ready. Your first live companion comes next."
      : "You can choose a tool now. Herdr must be ready before running the sample.",
  );
}
const phases: Record<string, [string, string, string, string, string, string, string]> = {
  starting: [
    "Starting your sample agent…",
    "Pet Town opens a small demo folder in Herdr.",
    "Starting in Herdr",
    "Your companion is on its way.",
    "We’ll wait for the real agent to begin working.",
    "nib-walk.png",
    "Continue later",
  ],
  waiting: [
    "Waiting for your agent…",
    "We’re watching your real session for activity and its desktop pet.",
    "Waiting for activity",
    "Your companion hasn’t appeared yet.",
    "If your tool needs setup, open its Herdr pane. You can stop the sample and retry.",
    "nib-walk.png",
    "Open in Herdr →",
  ],
  blocked: [
    "Your agent needs your input.",
    "Some tools ask you to sign in or approve their first session.",
    "Needs your input",
    "Finish this step in Herdr.",
    "Then return here. Pet Town will keep watching.",
    "nib-work.png",
    "Open in Herdr →",
  ],
  arrived: [
    "There it is!",
    "Your real companion reached Pet Street.",
    "Real agent connected",
    "Hello, little companion.",
    "Its state follows the agent as it works, waits and finishes.",
    "nib-sleep.png",
    "See it on my desktop →",
  ],
  error: [
    "The test couldn’t start.",
    "Your setup is saved. You can retry or start your own agent.",
    "Test interrupted",
    "Let’s check that connection.",
    "No second sample will be created while an earlier attempt is uncertain.",
    "nib-work.png",
    "Retry test →",
  ],
  own: [
    "Start an agent. Watch a pet appear.",
    "Use your usual coding tool in Herdr and give it a task.",
    "Waiting for your agent",
    "We’re watching for your new agent.",
    "Your pet appears when that agent begins working.",
    "nib-wave.png",
    "Continue later",
  ],
};
export function sampleView(root: HTMLElement, ctx: Context): void {
  const s = ctx.sample;
  const values = phases[s.phase];
  const note = root.querySelector<HTMLElement>(".stage-extra");
  if (note) note.hidden = !["blocked", "arrived"].includes(s.phase);
  root.classList.toggle("state-mode", Boolean(values));
  if (!values) return;
  root.querySelector(".own")?.remove();
  text(root, "[data-title]", values[0]);
  text(root, "[data-copy]", values[1]);
  text(root, "[data-tag]", values[2]);
  text(root, "[data-state-title]", values[3]);
  text(root, "[data-state-copy]", s.message ?? values[4]);
  text(root, "[data-next]", values[6]);
  const image = root.querySelector<HTMLImageElement>("[data-state-image]");
  if (image)
    image.src =
      "/onboarding/" +
      (s.status === "working"
        ? "nib-walk.png"
        : s.status === "blocked"
          ? "nib-work.png"
          : values[5]);
  if (s.owned && ["blocked", "waiting"].includes(s.phase)) {
    const retry = document.createElement("button");
    retry.className = "secondary";
    retry.dataset.retrySample = "";
    retry.textContent = "Retry hello after setup →";
    root.querySelector("[data-state-copy]")?.after(retry);
  }
  if (ctx.hasSample || (values && s.phase !== "arrived")) {
    const holder = document.createElement("div");
    holder.className = "sample-actions";
    if (ctx.hasSample)
      holder.innerHTML = `<button class="secondary" type="button" data-stop-sample>${s.owned ? "Stop sample" : "Stop previous sample"}</button>`;
    if (s.phase !== "arrived")
      holder.innerHTML +=
        '<button class="secondary" type="button" data-continue-later>Continue later →</button>';
    if (s.phase === "error")
      holder.innerHTML +=
        '<button class="secondary" type="button" data-own>Start my own agent →</button>';
    root.querySelector("main")?.append(holder);
  }
  root.dataset.sampleOwned = String(s.owned);
}
