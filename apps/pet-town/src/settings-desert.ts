import type { DesertMode, DesertScene, PreferencesFile } from "./preferences-types";
import { RendererDesert } from "./desert";
import { byId } from "./settings-dom";
import { bindRange } from "./settings-range";
import "./settings-desert.css";

/** Draft-only Desert preview; its scenery stays frozen and uses no separate clock. */
export class SettingsDesert {
  private readonly preview = byId<HTMLElement>("desert-preview");
  private readonly scenery = new RendererDesert(this.preview);
  private readonly scene = byId<HTMLSelectElement>("desert-scene");
  private readonly mode = byId<HTMLSelectElement>("desert-mode");
  private readonly slider = byId<HTMLInputElement>("desert-opacity");

  constructor(getDraft: () => PreferencesFile, render: () => void) {
    new ResizeObserver(() => this.scenery.advance(0, true, true)).observe(this.preview);
    this.scene.addEventListener("change", () => {
      const value = this.scene.value;
      if (value !== "palm-spring" && value !== "adobe-outpost" && value !== "lantern-caravan")
        return;
      getDraft().app.desertScene = value as DesertScene;
      render();
    });
    this.mode.addEventListener("change", () => {
      const value = this.mode.value;
      if (value !== "golden-dunes" && value !== "moonlit-oasis") return;
      getDraft().app.desertMode = value as DesertMode;
      render();
    });
    bindRange(
      "desert-opacity",
      (value) => {
        getDraft().app.desertOpacityPercent = value;
      },
      render,
    );
  }

  render(draft: PreferencesFile, readOnly: boolean): void {
    const active = draft.app.stripTheme === "desert";
    const opacity = draft.app.desertOpacityPercent;
    this.scene.value = draft.app.desertScene;
    this.scene.disabled = readOnly || !active;
    byId<HTMLElement>("desert-scene-row").hidden = !active;
    this.mode.value = draft.app.desertMode;
    this.mode.disabled = readOnly || !active;
    byId<HTMLElement>("desert-mode-row").hidden = !active;
    this.slider.value = String(opacity);
    this.slider.disabled = readOnly || !active;
    this.slider.setAttribute("aria-valuetext", `${opacity}% opaque, ${100 - opacity}% transparent`);
    byId<HTMLOutputElement>("desert-opacity-value").value = `${opacity}%`;
    byId<HTMLElement>("desert-opacity-row").hidden = !active;
    this.preview.hidden = !active;
    this.scenery.setPreferences(draft);
    this.scenery.advance(0, true, true);
  }
}
