import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

const byId = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;

export class VillageVisibilitySettings {
  private visible = true;
  private generation = 0;

  constructor(private readonly reportError: (message: string) => void) {}

  bind(): void {
    byId<HTMLButtonElement>("town-visibility-toggle").addEventListener("click", () => {
      void this.toggle();
    });
  }

  async load(): Promise<void> {
    await listen<{ visible: boolean }>("village-visibility-changed", (event) => {
      this.generation += 1;
      this.visible = event.payload.visible;
      this.render();
    });
    const generation = this.generation;
    const visible = await invoke<boolean>("village_visible");
    if (generation === this.generation) {
      this.visible = visible;
      this.render();
    }
  }

  render(): void {
    byId<HTMLElement>("town-visibility-status").textContent = this.visible
      ? "Visible above the Dock"
      : "Hidden while Pet Town keeps running";
    byId<HTMLButtonElement>("town-visibility-toggle").textContent = this.visible
      ? "Hide Town"
      : "Show Town";
  }

  private async toggle(): Promise<void> {
    const generation = ++this.generation;
    try {
      const visible = await invoke<boolean>("set_village_visible", {
        visible: !this.visible,
      });
      if (generation === this.generation) {
        this.visible = visible;
        this.render();
      }
    } catch (error) {
      this.reportError(`Could not change town visibility. ${String(error)}`);
    }
  }
}
