import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { byId } from "./settings-dom";
import {
  renderTownInstall,
  townInstallBusy,
  type TownInstallSnapshot,
} from "./settings-town-install-view";

export class SettingsTownInstall {
  private snapshot: TownInstallSnapshot | null = null;
  private pending = false;
  private cancelling = false;
  private error = "";
  private connected = false;

  constructor(
    private readonly reportError: (message: string) => void,
    private readonly syncInteractionLock: () => void,
  ) {
    byId("download-pet-town").addEventListener("click", () => {
      void this.run("install_town_component");
    });
    byId("remove-pet-town").addEventListener("click", () => {
      if (
        confirm(
          "Remove the downloaded Pet Town world? Your saved games and preferences will be kept.",
        )
      )
        void this.run("remove_town_component");
    });
    byId("open-3d-town").addEventListener("click", () => {
      void this.open();
    });
    byId("cancel-town-download").addEventListener("click", () => {
      void this.cancel();
    });
    byId("retry-town-state").addEventListener("click", () => {
      void this.connect();
    });
    void this.connect();
  }

  private receive(snapshot: TownInstallSnapshot): void {
    if (snapshot.revision < (this.snapshot?.revision ?? -1)) return;
    this.snapshot = snapshot;
    if (!townInstallBusy(snapshot.phase)) this.cancelling = false;
    this.error = "";
    this.render();
  }

  private async connect(): Promise<void> {
    this.error = "";
    try {
      if (!this.connected) {
        await listen<TownInstallSnapshot>("town-install-state", (event) =>
          this.receive(event.payload),
        );
        this.connected = true;
      }
      this.receive(await invoke<TownInstallSnapshot>("get_town_install_state"));
    } catch (error) {
      this.error = `Could not check Pet Town. ${String(error)}`;
    }
    this.render();
  }

  private async run(command: "install_town_component" | "remove_town_component"): Promise<void> {
    if (this.pending) return;
    this.pending = true;
    this.error = "";
    this.render();
    try {
      this.receive(await invoke<TownInstallSnapshot>(command));
    } catch (error) {
      // Read current local state even if the operation's final event was missed.
      await this.connect();
      this.error = String(error);
    } finally {
      this.pending = false;
      this.cancelling = false;
      this.render();
    }
  }

  private async cancel(): Promise<void> {
    if (this.cancelling) return;
    this.cancelling = true;
    this.render();
    try {
      await invoke("cancel_town_install");
    } catch (error) {
      this.cancelling = false;
      this.error = String(error);
      this.render();
    }
  }

  private async open(): Promise<void> {
    try {
      await invoke("open_3d_town");
    } catch (error) {
      await this.connect();
      this.error = String(error);
      this.reportError(this.error);
      this.render();
    }
  }

  render(): void {
    const active = document.activeElement as HTMLElement | null;
    renderTownInstall(this.snapshot, this.pending, this.cancelling, this.error);
    this.syncInteractionLock();
    if (active?.closest(".town-install-actions") && active.hidden) {
      document
        .querySelector<HTMLButtonElement>(
          ".town-install-actions button:not([hidden]):not(:disabled)",
        )
        ?.focus();
    }
  }
}
