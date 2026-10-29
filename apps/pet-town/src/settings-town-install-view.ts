import { byId } from "./settings-dom";

export interface TownInstallSnapshot {
  revision: number;
  phase: "absent" | "ready" | "incompatible" | "downloading" | "verifying" | "installing" | "error";
  installedVersion: string | null;
  downloadedBytes: number;
  totalBytes: number | null;
  error: string | null;
}

export const townInstallBusy = (phase?: TownInstallSnapshot["phase"]): boolean =>
  phase === "downloading" || phase === "verifying" || phase === "installing";

const size = (bytes: number): string => `${(bytes / (1024 * 1024)).toFixed(1)} MiB`;

export function renderTownInstall(
  snapshot: TownInstallSnapshot | null,
  pending: boolean,
  cancelling: boolean,
  error: string,
): void {
  const phase = snapshot?.phase;
  const busy = pending || townInstallBusy(phase);
  const ready = phase === "ready";
  const download = byId<HTMLButtonElement>("download-pet-town");
  const open = byId<HTMLButtonElement>("open-3d-town");
  const remove = byId<HTMLButtonElement>("remove-pet-town");
  const cancel = byId<HTMLButtonElement>("cancel-town-download");
  const retry = byId<HTMLButtonElement>("retry-town-state");
  download.hidden = !snapshot || ready || busy;
  download.disabled = busy;
  download.textContent =
    phase === "incompatible"
      ? "Update Pet Town"
      : phase === "error"
        ? "Retry download"
        : "Download Pet Town";
  open.hidden = !ready;
  open.disabled = busy;
  remove.hidden = !snapshot?.installedVersion || busy;
  remove.disabled = busy;
  cancel.hidden = phase !== "downloading" && phase !== "verifying";
  cancel.disabled = cancelling;
  cancel.textContent = cancelling ? "Cancelling…" : "Cancel download";
  retry.hidden = Boolean(snapshot) || !error;
  retry.disabled = busy;

  let message = "Checking local installation…";
  switch (phase) {
    case "absent":
      message = "Not installed. Download the 3D world here when you want to play.";
      break;
    case "ready":
      message = `Pet Town ${snapshot?.installedVersion ?? ""} is ready to open.`;
      break;
    case "incompatible":
      message = "Download the Pet Town version for this app. Your saved world stays on this Mac.";
      break;
    case "downloading":
      message = snapshot?.totalBytes
        ? `Downloading ${size(snapshot.downloadedBytes)} of ${size(snapshot.totalBytes)}…`
        : `Downloading ${size(snapshot?.downloadedBytes ?? 0)}…`;
      break;
    case "verifying":
      message = "Verifying the download before installation…";
      break;
    case "installing":
      message = "Installing Pet Town…";
      break;
    case "error":
      message = "Pet Town could not be installed. You can retry the download.";
  }
  if (pending && !townInstallBusy(phase)) message = "Working…";
  byId("town-install-status").textContent = error || snapshot?.error || message;
  const progress = byId<HTMLProgressElement>("town-install-progress");
  progress.hidden = !townInstallBusy(phase);
  if (phase === "downloading" && snapshot?.totalBytes) {
    progress.max = snapshot.totalBytes;
    progress.value = snapshot.downloadedBytes;
  } else {
    progress.removeAttribute("value");
  }
}
