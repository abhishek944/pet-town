import type { PreferencesFile } from "./preferences-types";
import { RendererRainforest } from "./rainforest";
import { byId } from "./settings-dom";
import { bindRange } from "./settings-range";
import "./settings-rainforest.css";

/** Draft-only opacity preview. No village clock, native calls or saved state. */
export class SettingsRainforest {
  private readonly preview = byId<HTMLElement>("rainforest-preview");
  private readonly forest = new RendererRainforest(this.preview);
  private readonly slider = byId<HTMLInputElement>("rainforest-opacity");

  constructor(getDraft: () => PreferencesFile, render: () => void) {
    // App-tab visibility and window resizing can change bounds without a draft edit.
    new ResizeObserver(() => this.forest.advance(0, true, true)).observe(this.preview);
    bindRange(
      "rainforest-opacity",
      (value) => {
        getDraft().app.rainforestOpacityPercent = value;
      },
      render,
    );
  }

  render(draft: PreferencesFile, readOnly: boolean): void {
    const active = draft.app.stripTheme === "rainforest";
    const opacity = draft.app.rainforestOpacityPercent;
    this.slider.value = String(opacity);
    this.slider.disabled = readOnly || !active;
    this.slider.setAttribute("aria-valuetext", `${opacity}% opaque, ${100 - opacity}% transparent`);
    byId<HTMLOutputElement>("rainforest-opacity-value").value = `${opacity}%`;
    byId<HTMLElement>("rainforest-opacity-row").hidden = !active;
    this.preview.hidden = !active;
    this.forest.setPreferences(draft);
    // A static preview still reflects slider/mode edits immediately, without another RAF.
    this.forest.advance(0, true, true);
  }
}
