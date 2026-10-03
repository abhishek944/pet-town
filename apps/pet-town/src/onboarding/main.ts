import { invoke } from "@tauri-apps/api/core";
import { render } from "./view";
import { freezeArtwork } from "./artwork";
import { chooseScenery } from "./scenery";
import type { Actions, Context } from "./types";
const root = document.querySelector<HTMLElement>("#onboarding")!;
const feedback = document.querySelector<HTMLElement>("#feedback")!;
let ctx: Context;
let pending = false;
let lastView = "";
let restoreFocus: string | null = null;
let restoreFocusStep: number | null = null;
let pollFlight: Promise<void> | null = null;
function show(force = false): void {
  const key = JSON.stringify(ctx);
  if (!force && key === lastView) return;
  const active = document.activeElement as HTMLElement | null;
  const selector =
    (restoreFocusStep === ctx.step ? restoreFocus : null) ??
    (active?.id
      ? `#${CSS.escape(active.id)}`
      : active?.dataset.tool
        ? `[data-tool="${active.dataset.tool}"]`
        : null);
  const changedStep = !root.classList.contains(`step-${ctx.step}`);
  lastView = key;
  render(root, ctx, actions);
  if (changedStep || (restoreFocusStep !== null && restoreFocusStep !== ctx.step)) {
    const heading = root.querySelector<HTMLElement>("h1");
    heading?.setAttribute("tabindex", "-1");
    heading?.focus();
  } else if (selector) {
    const target = root.querySelector<HTMLButtonElement>(selector);
    if (target && !target.disabled && !target.hidden) target.focus();
    else {
      const heading = root.querySelector<HTMLElement>("h1");
      heading?.setAttribute("tabindex", "-1");
      heading?.focus();
    }
  }
}
async function refresh(poll = false): Promise<void> {
  ctx = await invoke<Context>(poll ? "poll_onboarding_sample" : "get_onboarding_context");
  ctx.busy ||= pending;
  show();
}
async function perform(task: () => Promise<unknown>): Promise<void> {
  if (pending || ctx.busy) return;
  const active = document.activeElement as HTMLElement | null;
  restoreFocus = active?.id ? `#${CSS.escape(active.id)}` : null;
  restoreFocusStep = ctx.step;
  pending = true;
  feedback.hidden = true;
  ctx.busy = true;
  show();
  try {
    if (pollFlight) await pollFlight;
    await task();
  } catch (error) {
    feedback.textContent = String(error);
    feedback.hidden = false;
  } finally {
    pending = false;
    await refresh().catch(() => {});
    restoreFocus = null;
    restoreFocusStep = null;
  }
}
async function save(step: number, skipped = false): Promise<void> {
  await invoke("save_onboarding", { step, tool: ctx.tool, skipped });
}
async function next(): Promise<void> {
  if (ctx.step === 2) await invoke("set_onboarding_appearance", { theme: ctx.stripTheme });
  if (ctx.step === 3 && ["error", "checking"].includes(ctx.dependency.phase)) {
    await invoke("check_onboarding");
    return;
  }
  if (ctx.step === 3 && ctx.dependency.phase !== "ready") {
    await invoke(
      ctx.dependency.phase === "missing" ? "install_onboarding_herdr" : "onboarding_handoff",
      { destination: "herdr" },
    );
    await invoke("check_onboarding");
    return;
  }
  if (ctx.step === 4) {
    const tool = ctx.tools.find((t) => t.id === ctx.tool);
    if (!tool) throw new Error("Choose a coding tool first.");
    if (tool.status !== "found" || tool.readiness === "signIn") {
      await invoke("onboarding_handoff", { destination: "toolGuide" });
      await invoke("check_onboarding");
      return;
    }
  }
  if (ctx.step === 5) {
    if (ctx.sample.phase === "error") {
      await invoke("run_onboarding_sample");
      return;
    }
    if (["waiting", "blocked"].includes(ctx.sample.phase)) {
      await invoke("onboarding_handoff", { destination: ctx.sample.agentId ? "sample" : "herdr" });
      return;
    }
    if (ctx.sample.phase === "arrived")
      await invoke("onboarding_handoff", { destination: "desktop" });
    await save(6, ctx.sample.phase !== "arrived");
    return;
  }
  if (ctx.step === 7) {
    await invoke("finish_onboarding");
    return;
  }
  await save(ctx.step + 1);
  if (ctx.step + 1 === 3 || ctx.step + 1 === 4) await invoke("check_onboarding");
}
const actions: Actions = {
  next: () => perform(next),
  back: () => perform(() => save(Math.max(0, ctx.step - 1))),
  skip: () =>
    perform(async () => {
      await save(6, true);
      await invoke("onboarding_handoff", { destination: "town" });
      await invoke("finish_onboarding");
    }),
  later: () => perform(() => save(6, true)),
  selectTool: (id) =>
    perform(async () => {
      await invoke("save_onboarding", { step: ctx.step, tool: id, skipped: false });
      await invoke("check_onboarding");
    }),
  selectTheme: (theme) => {
    if (!pending) {
      ctx.stripTheme = theme;
      chooseScenery(root, theme, ctx.previewPreferences);
      void freezeArtwork(root);
    }
  },
  check: () => perform(() => invoke("check_onboarding")),
  install: () => perform(() => invoke("install_onboarding_herdr")),
  test: () => perform(() => invoke("run_onboarding_sample")),
  stop: () => perform(() => invoke("stop_onboarding_sample")),
  handoff: (destination) =>
    perform(async () => {
      await invoke("onboarding_handoff", { destination });
      if (destination === "mayor") await invoke("finish_onboarding");
    }),
  finish: () => perform(() => invoke("finish_onboarding")),
};
async function start(): Promise<void> {
  try {
    ctx = await invoke<Context>("get_onboarding_context");
    if (!ctx.installationReady) {
      root.innerHTML =
        '<main class="move-install"><img src="/onboarding/app.png" width="96" alt="Pet Town"><h1>Let’s move in first.</h1><p>Drag Pet Town to Applications, then open it from there.</p><button class="primary">Open Applications →</button></main>';
      root.querySelector("button")?.addEventListener("click", () => {
        void invoke("onboarding_handoff", { destination: "applications" });
      });
      return;
    }
    show(true);
    matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", () => show(true));
    const poll = async () => {
      if (pending || ctx.busy) await refresh().catch(() => {});
      else if (ctx.step === 5) {
        pollFlight = refresh(true).catch(() => {});
        await pollFlight;
        pollFlight = null;
      }
      window.setTimeout(() => {
        void poll();
      }, 1_000);
    };
    void poll();
    if (ctx.step === 3 || ctx.step === 4 || ctx.step === 5)
      await perform(() => invoke("check_onboarding"));
  } catch {
    root.innerHTML =
      '<main class="move-install"><h1>Setup couldn’t open.</h1><p>Close this window, then choose Welcome &amp; setup from the Pet Town menu.</p></main>';
  }
}
void start();
