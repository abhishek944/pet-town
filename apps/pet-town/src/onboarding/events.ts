import type { Actions, Context } from "./types";
import type { StripTheme } from "../preferences-types";
export function bind(root: HTMLElement, ctx: Context, actions: Actions): void {
  const on = (selector: string, action: () => void | Promise<void>) => {
    root.querySelectorAll<HTMLButtonElement>(selector).forEach((button) => {
      button.disabled ||= ctx.busy;
      button.addEventListener("click", () => {
        void action();
      });
    });
  };
  on(".next > :first-child", actions.back);
  on(".next > :last-child", actions.next);
  on(".step-0 .actions .primary", actions.next);
  on(".step-0 .actions .secondary,.explore button", actions.skip);
  on("[data-tool]", () => {});
  for (const button of root.querySelectorAll<HTMLButtonElement>("[data-tool]")) {
    button.addEventListener("click", () => {
      void actions.selectTool(button.dataset.tool!);
    });
  }
  for (const button of root.querySelectorAll<HTMLButtonElement>("[data-theme-choice]")) {
    button.addEventListener("click", () =>
      actions.selectTheme(button.dataset.themeChoice as StripTheme),
    );
  }
  on("[data-test],[data-retry-sample]", actions.test);
  on("[data-stop-sample]", actions.stop);
  on("[data-continue-later]", actions.later);
  on("[data-own]", () => actions.handoff("own"));
  on(".town-link button", () => actions.handoff("town"));
  on("[data-check-again]", actions.check);
  const dialog = root.querySelector<HTMLElement>("[data-dialog]");
  on("[data-mayor]", () => {
    dialog?.setAttribute("open", "");
    dialog?.querySelector<HTMLButtonElement>("[data-close]")?.focus();
  });
  const close = () => {
    dialog?.removeAttribute("open");
    root.querySelector<HTMLButtonElement>("[data-mayor]")?.focus();
  };
  on("[data-close]", close);
  on("[data-open-mayor]", () => actions.handoff("mayor"));
  dialog?.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
    }
    if (event.key !== "Tab") return;
    const buttons = [...dialog.querySelectorAll<HTMLButtonElement>("button")];
    const first = buttons[0],
      last = buttons[buttons.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  });
}
