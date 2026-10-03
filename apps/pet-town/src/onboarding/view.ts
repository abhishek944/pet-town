import { freezeArtwork } from "./artwork";
import { templates } from "./templates";
import { bind } from "./events";
import { dependencyView, toolView, sampleView, text } from "./presentation";
import { mountScenery } from "./scenery";
import type { Actions, Context } from "./types";
export function render(root: HTMLElement, ctx: Context, actions: Actions): void {
  root.className = `step-${ctx.step}`;
  root.setAttribute("aria-busy", String(ctx.busy));
  root.innerHTML = templates[ctx.step] ?? templates[0];
  if (ctx.step === 2) mountScenery(root, ctx.stripTheme, ctx.previewPreferences);
  if (ctx.step === 3) {
    dependencyView(root, ctx);
    const check = document.createElement("button");
    check.className = "secondary check-again";
    check.dataset.checkAgain = "";
    check.textContent = "Check again";
    root.querySelector(".detail")?.append(check);
  }
  if (ctx.step === 4) {
    toolView(root, ctx);
    const selected = ctx.tools.find((tool) => tool.id === ctx.tool);
    if (selected && (selected.status === "missing" || selected.readiness === "signIn")) {
      const check = document.createElement("button");
      check.className = "secondary";
      check.dataset.checkAgain = "";
      check.textContent = "Check installation & sign-in again";
      root.querySelector(".check-panel")?.append(check);
    }
  }
  if (ctx.step === 5) {
    const label = ctx.tools.find((t) => t.id === ctx.tool)?.label ?? "your chosen coding tool";
    text(
      root,
      ".proof > p:not(.usage)",
      `We’ll run a short hello in Herdr using ${label}. No project setup needed.`,
    );
    sampleView(root, ctx);
    const selected = ctx.tools.find((tool) => tool.id === ctx.tool);
    const test = root.querySelector<HTMLButtonElement>("[data-test]");
    if (test && selected?.readiness !== "ready") {
      test.disabled = true;
      test.textContent = "Finish sign-in in Herdr first";
      text(
        root,
        ".proof > p:not(.usage)",
        selected?.message ?? "Choose and check a coding tool before running the sample.",
      );
    }
  }
  if (ctx.step === 7) {
    const button = root.querySelector<HTMLButtonElement>("[data-dialog] .primary");
    if (button) {
      delete button.dataset.close;
      button.dataset.openMayor = "";
      button.textContent = "Open Mayor Settings →";
    }
  }
  root.querySelectorAll<HTMLButtonElement>("button").forEach((button, index) => {
    const action = button.getAttributeNames().find((name) => name.startsWith("data-"));
    button.id ||= button.dataset.tool
      ? `onboarding-tool-${button.dataset.tool}`
      : button.dataset.themeChoice
        ? `onboarding-theme-${button.dataset.themeChoice}`
        : button.closest(".next")
          ? button.matches(":last-child")
            ? "onboarding-primary"
            : "onboarding-back"
          : action
            ? `onboarding-${action.slice(5)}`
            : `onboarding-control-${index}`;
  });
  bind(root, ctx, actions);
  void freezeArtwork(root);
}
