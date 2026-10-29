import { RendererActivities } from "./activity-themes";
import { isActivityTheme, type CoasterMode, type PreferencesFile } from "./preferences-types";
import { byId } from "./settings-dom";
import { bindRange } from "./settings-range";

/** Static draft preview; no animation clock or native agent actions. */
export class SettingsActivities {
  private readonly preview = byId<HTMLElement>("activity-preview");
  private readonly scene = new RendererActivities(this.preview);
  private readonly mode = byId<HTMLSelectElement>("coaster-mode");
  constructor(draft: () => PreferencesFile, render: () => void) {
    bindRange(
      "coaster-height",
      (value) => {
        draft().app.coasterHeightPx = value;
      },
      render,
    );
    this.mode.addEventListener("change", () => {
      if (
        !["low-rolling", "twilight-carnival", "firefly-gardens", "cloudline"].includes(
          this.mode.value,
        )
      )
        return;
      draft().app.coasterMode = this.mode.value as CoasterMode;
      render();
    });
  }
  render(draft: PreferencesFile, readOnly: boolean): void {
    const coaster = draft.app.stripTheme === "rollercoaster";
    this.mode.value = draft.app.coasterMode ?? "low-rolling";
    this.mode.disabled = readOnly || !coaster;
    byId<HTMLElement>("coaster-mode-row").hidden = !coaster;
    const height = draft.app.coasterHeightPx ?? 88;
    const slider = byId<HTMLInputElement>("coaster-height");
    slider.value = String(height);
    slider.disabled = readOnly || !coaster;
    slider.setAttribute("aria-valuetext", `${height}px ride height`);
    byId<HTMLOutputElement>("coaster-height-value").value = `${height}px`;
    byId<HTMLElement>("coaster-height-row").hidden = !coaster;
    this.preview.hidden = !isActivityTheme(draft.app.stripTheme);
    this.scene.setPreferences(draft);
    this.scene.advance(0, true, true);
  }
}
