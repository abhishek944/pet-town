import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { hudState } from "../state.js";
import { TownSettingsUpdatesView } from "./settings-updates-view.js";

const busyPhases = new Set(["preparing", "installing"]);
let started = false;

export function startTownSettingsUpdates(root, context, setInteractionLocked) {
  if (started) return;
  started = true;
  new TownSettingsUpdates(root, context, setInteractionLocked).start();
}

class TownSettingsUpdates {
  constructor(root, context, setInteractionLocked) {
    this.context = context;
    this.setInteractionLocked = setInteractionLocked;
    this.snapshot = null;
    this.unavailable = false;
    this.receivedEvent = false;
    this.latestRevision = -1;
    this.localError = "";
    this.locked = false;
    this.responsePending = false;
    this.installPending = false;
    this.rejectedRequestId = "";
    this.view = new TownSettingsUpdatesView(root, {
      check: () => void this.runSnapshotCommand("check_app_updates"),
      download: () => void this.runSnapshotCommand("download_app_update"),
      install: () => void this.installUpdate(),
    });
  }

  async start() {
    try {
      const unlistenState = await listen("app-update-state", (event) => {
        this.receivedEvent = true;
        this.receive(event.payload);
      });
      try {
        await listen(
          "app-update-prepare-install",
          (event) => void this.prepareInstall(event.payload),
        );
      } catch (error) {
        unlistenState();
        throw error;
      }
      const receivedBeforeSnapshot = this.receivedEvent;
      const snapshot = await invoke("get_app_update_state");
      if (!receivedBeforeSnapshot && !this.receivedEvent) this.receive(snapshot);
      if (this.snapshot?.phase === "idle") void this.runSnapshotCommand("check_app_updates");
    } catch {
      this.unavailable = true;
    }
    this.render();
  }

  /** @param {import('./settings-updates-view.js').UpdateSnapshot} snapshot */
  receive(snapshot) {
    if (snapshot.revision < this.latestRevision) return false;
    this.latestRevision = snapshot.revision;
    this.snapshot = snapshot;
    this.localError = "";
    if (busyPhases.has(snapshot.phase)) {
      if (!(snapshot.phase === "preparing" && this.rejectedRequestId)) this.setLocked(true);
      this.installPending = false;
    } else {
      this.installPending = false;
      this.rejectedRequestId = "";
      if (!this.responsePending) this.setLocked(false);
    }
    this.render();
    return true;
  }

  async prepareInstall({ requestId }) {
    this.responsePending = true;
    this.setLocked(true);
    if (hudState.hudRuntime.confirm) {
      const reason = "Close the world reset confirmation before installing.";
      this.rejectedRequestId = requestId;
      this.localError = reason;
      try {
        await invoke("respond_app_update_prepare", { requestId, ready: false, error: reason });
      } catch (error) {
        this.localError = `${reason} ${String(error?.message ?? error)}`;
      } finally {
        this.responsePending = false;
      }
      this.setLocked(false);
      this.render();
      return;
    }

    try {
      if (typeof this.context.building?.saveNow !== "function") {
        throw new Error("Town is not ready to save yet. Try installing again in a moment.");
      }
      const saved = await this.context.building.saveNow();
      if (saved === "none")
        throw new Error("Your town changes could not be saved. Save them before installing.");
      await invoke("respond_app_update_prepare", { requestId, ready: true, error: null });
    } catch (error) {
      const reason = String(error?.message ?? error);
      this.rejectedRequestId = requestId;
      this.localError = reason;
      try {
        await invoke("respond_app_update_prepare", { requestId, ready: false, error: reason });
      } catch (responseError) {
        this.localError = `${reason} ${String(responseError?.message ?? responseError)}`;
      }
    } finally {
      this.responsePending = false;
    }
    if (
      this.rejectedRequestId === requestId ||
      (this.snapshot && !busyPhases.has(this.snapshot.phase))
    )
      this.setLocked(false);
    this.render();
  }

  async runSnapshotCommand(command) {
    this.localError = "";
    this.render();
    const revision = this.latestRevision;
    try {
      const snapshot = await invoke(command);
      if (snapshot) this.receive(snapshot);
    } catch (error) {
      if (revision === this.latestRevision) this.localError = String(error?.message ?? error);
      this.render();
    }
  }

  async installUpdate() {
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
      const snapshot = await invoke("get_app_update_state");
      if (snapshot) this.receive(snapshot);
    } catch (error) {
      this.installPending = false;
      const message = String(error?.message ?? error);
      const revision = this.latestRevision;
      try {
        const snapshot = await invoke("get_app_update_state");
        if (snapshot && this.receive(snapshot) && !snapshot.error) {
          this.localError = message;
          this.render();
        }
      } catch {
        if (revision === this.latestRevision) this.localError = message;
        this.render();
      }
    }
  }

  setLocked(locked) {
    if (this.locked === locked) return;
    this.locked = locked;
    this.setInteractionLocked(locked);
  }

  render() {
    this.view.render(
      this.snapshot,
      this.unavailable,
      this.localError,
      this.locked,
      this.installPending,
    );
  }
}
