import type { PreferencesFile, SnowMode } from "./preferences-types";
import { RendererSnowy } from "./snow";
import { byId } from "./settings-dom";
import { bindRange } from "./settings-range";
import "./settings-snow.css";

/** Draft-only Snowy preview; it uses no village clock or independent animation loop. */
export class SettingsSnow {
  private readonly preview = byId<HTMLElement>("snow-preview");
  private readonly scenery = new RendererSnowy(this.preview);
  private readonly mode = byId<HTMLSelectElement>("snow-mode");
  private readonly slider = byId<HTMLInputElement>("snow-opacity");

  constructor(getDraft: () => PreferencesFile, render: () => void) {
    new ResizeObserver(() => this.scenery.advance(0, true, true)).observe(this.preview);
    this.mode.addEventListener("change", () => {
      const value = this.mode.value;
      if (value !== "fresh-snow" && value !== "aurora-night") return;
      getDraft().app.snowMode = value as SnowMode;
      render();
    });
    bindRange(
      "snow-opacity",
      (value) => {
        getDraft().app.snowOpacityPercent = value;
      },
      render,
    );
  }

  render(draft: PreferencesFile, readOnly: boolean): void {
    const active = draft.app.stripTheme === "snowy";
    const opacity = draft.app.snowOpacityPercent;
    this.mode.value = draft.app.snowMode;
    this.mode.disabled = readOnly || !active;
    byId<HTMLElement>("snow-mode-row").hidden = !active;
    this.slider.value = String(opacity);
    this.slider.disabled = readOnly || !active;
    this.slider.setAttribute("aria-valuetext", `${opacity}% opaque, ${100 - opacity}% transparent`);
    byId<HTMLOutputElement>("snow-opacity-value").value = `${opacity}%`;
    byId<HTMLElement>("snow-opacity-row").hidden = !active;
    this.preview.hidden = !active;
    this.scenery.setPreferences(draft);
    this.scenery.advance(0, true, true);
  }
}
