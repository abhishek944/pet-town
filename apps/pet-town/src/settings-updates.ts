import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { SettingsUpdatesView } from "./settings-updates-view";
import {
  busyPhases,
  type PrepareInstallRequest,
  type UpdateSnapshot,
} from "./settings-updates-types";

type SettingsControl = HTMLElement & { disabled: boolean };

export class SettingsUpdates {
  private snapshot: UpdateSnapshot | null = null;
  private unavailable = false;
  private started = false;
  private latestRevision = -1;
  private receivedEvent = false;
  private operationError = "";
  private locked = false;
  private installPending = false;
  private rejectedRequestId = "";
  private responsePending = false;
  private readonly view: SettingsUpdatesView;
  private readonly previousDisabled = new Map<SettingsControl, boolean>();

  constructor(
    private readonly preparationBlockReason: () => string | null,
    private readonly showMessage: (message: string) => void,
    private readonly changed: () => void,
  ) {
    this.view = new SettingsUpdatesView(
      () => void this.runSnapshotCommand("check_app_updates"),
      () => void this.runSnapshotCommand("download_app_update"),
      () => void this.install(),
    );
  }

  start(): void {
    if (this.started) return;
    this.started = true;
    void this.connect();
  }

  syncInteractionLock(): void {
    if (!this.locked) return;
    for (const control of document.querySelectorAll<SettingsControl>(
      "button,input,select,textarea",
    )) {
      if (control.closest(".toolbar")) continue;
      if (!this.previousDisabled.has(control)) this.previousDisabled.set(control, control.disabled);
      control.disabled = true;
    }
  }

  private async connect(): Promise<void> {
    try {
      const unlistenState = await listen<UpdateSnapshot>("app-update-state", (event) => {
        this.receivedEvent = true;
        this.receive(event.payload);
      });
      try {
        await listen<PrepareInstallRequest>("app-update-prepare-install", (event) => {
          void this.prepareInstall(event.payload);
        });
      } catch (error) {
        unlistenState();
        throw error;
      }
      const receivedBeforeSnapshot = this.receivedEvent;
      const current = await invoke<UpdateSnapshot>("get_app_update_state");
      if (!receivedBeforeSnapshot && !this.receivedEvent) this.receive(current);
      if (this.snapshot?.phase === "idle") void this.runSnapshotCommand("check_app_updates");
    } catch {
      this.unavailable = true;
      this.changed();
    }
    this.render();
  }

  private receive(snapshot: UpdateSnapshot): boolean {
    if (snapshot.revision < this.latestRevision) return false;
    this.latestRevision = snapshot.revision;
    this.snapshot = snapshot;
    this.operationError = "";
    if (busyPhases.has(snapshot.phase)) {
      const refused = snapshot.phase === "preparing" && Boolean(this.rejectedRequestId);
      if (!refused) this.setLocked(true);
      this.installPending = false;
    } else {
      this.installPending = false;
      this.rejectedRequestId = "";
      if (!this.responsePending) this.setLocked(false);
    }
    this.render();
    return true;
  }

  private async prepareInstall({ requestId }: PrepareInstallRequest): Promise<void> {
    const reason = this.preparationBlockReason();
    if (reason) {
      this.rejectedRequestId = requestId;
      this.operationError = reason;
      this.setLocked(false);
      this.showMessage(reason);
      try {
        await invoke("respond_app_update_prepare", { requestId, ready: false, error: reason });
      } catch (error) {
        this.operationError = String(error);
      }
      this.render();
      return;
    }

    this.operationError = "";
    this.responsePending = true;
    this.setLocked(true);
    try {
      await invoke("respond_app_update_prepare", { requestId, ready: true, error: null });
    } catch (error) {
      this.rejectedRequestId = requestId;
      this.operationError = String(error);
      this.setLocked(false);
    } finally {
      this.responsePending = false;
    }
    if (this.snapshot && !busyPhases.has(this.snapshot.phase)) this.setLocked(false);
    this.render();
  }

  private async runSnapshotCommand(
    command: "check_app_updates" | "download_app_update",
  ): Promise<void> {
    this.operationError = "";
    this.render();
    const revision = this.latestRevision;
    try {
      const snapshot = await invoke<UpdateSnapshot>(command);
      if (snapshot) this.receive(snapshot);
    } catch (error) {
      if (revision === this.latestRevision) this.operationError = String(error);
      this.render();
    }
  }

  private async install(): Promise<void> {
    if (this.snapshot?.phase !== "ready" || this.installPending) return;
    if (
      !window.confirm(
        "Installing will close all Pet Town windows and end active Mayor voice or terminal sessions. Save your work in every open window before continuing. Install and restart now?",
      )
    )
      return;
    this.installPending = true;
    this.setLocked(true);
    this.render();
    try {
      await invoke("install_app_update");
      const snapshot = await invoke<UpdateSnapshot>("get_app_update_state");
      if (snapshot) this.receive(snapshot);
    } catch (error) {
      this.installPending = false;
      const message = String(error);
      const revision = this.latestRevision;
      try {
        const snapshot = await invoke<UpdateSnapshot>("get_app_update_state");
        if (snapshot && this.receive(snapshot) && !snapshot.error) {
          this.operationError = message;
          this.render();
        }
      } catch {
        if (revision === this.latestRevision) this.operationError = message;
        this.render();
      }
    }
  }

  private setLocked(locked: boolean): void {
    if (this.locked === locked) return this.syncInteractionLock();
    this.locked = locked;
    if (locked) {
      this.syncInteractionLock();
    } else {
      for (const [control, disabled] of this.previousDisabled) control.disabled = disabled;
      this.previousDisabled.clear();
      this.changed();
    }
  }

  private render(): void {
    this.view.render(
      this.snapshot,
      this.unavailable,
      this.operationError,
      this.locked,
      this.installPending,
    );
    this.syncInteractionLock();
  }
}
