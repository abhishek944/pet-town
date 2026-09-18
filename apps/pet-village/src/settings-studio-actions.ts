import type { MenuAction } from "./settings-studio-extension";

export function renderStudioActions(
  actions: readonly MenuAction[],
  remove: (id: string) => void,
): void {
  const root = document.getElementById("studio-actions-list")!;
  root.replaceChildren();
  if (!actions.length) {
    root.textContent = "No menu actions.";
    return;
  }
  root.append("Menu actions: ");
  actions.forEach((action) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "studio-action-chip";
    button.textContent = `${action.label} ×`;
    button.setAttribute("aria-label", `Remove ${action.label} menu action`);
    button.addEventListener("click", () => remove(action.id));
    root.append(button);
  });
}
