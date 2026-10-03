import type { UpdateSnapshot } from "./settings-updates-types";

const get = <T extends HTMLElement>(selector: string) => document.querySelector<T>(selector)!;

export class SettingsUpdatesView {
  private readonly title = get<HTMLElement>("[data-update-title]");
  private readonly copy = get<HTMLElement>("[data-update-copy]");
  private readonly badge = get<HTMLElement>("[data-update-badge]");
  private readonly news = get<HTMLAnchorElement>("[data-update-news]");
  private readonly check = get<HTMLButtonElement>("[data-update-check]");
  private readonly download = get<HTMLButtonElement>("[data-update-download]");
  private readonly install = get<HTMLButtonElement>("[data-update-install]");
  private readonly progressRow = get<HTMLElement>("[data-update-progress-row]");
  private readonly progress = get<HTMLProgressElement>("[data-update-progress]");
  private readonly progressCopy = get<HTMLElement>("[data-update-progress-copy]");

  constructor(onCheck: () => void, onDownload: () => void, onInstall: () => void) {
    this.check.addEventListener("click", onCheck);
    this.download.addEventListener("click", onDownload);
    this.install.addEventListener("click", onInstall);
  }

  render(
    snapshot: UpdateSnapshot | null,
    unavailable: boolean,
    error: string,
    locked: boolean,
    installPending: boolean,
  ): void {
    const phase = snapshot?.phase;
    if (unavailable) {
      this.title.textContent = "App updates require Pet Town desktop";
      this.copy.textContent = "Open Settings in Pet Town desktop to check for updates.";
    } else {
      const version = snapshot?.currentVersion ?? "";
      switch (phase) {
        case "idle":
          this.title.textContent = "Check for updates";
          this.copy.textContent = `Current version ${version}.`;
          break;
        case "checking":
          this.title.textContent = "Checking for updates…";
          this.copy.textContent = "Checking for a newer Pet Town release.";
          break;
        case "current":
          this.title.textContent = "Pet Town is up to date";
          this.copy.textContent = `You have version ${version}.`;
          break;
        case "available":
          this.title.textContent = `Pet Town ${snapshot?.availableVersion ?? "update"} is available`;
          this.copy.textContent = `You have version ${version}. Restart only when you choose.`;
          break;
        case "downloading":
          this.title.textContent = `Downloading Pet Town ${snapshot?.availableVersion ?? "update"}…`;
          this.copy.textContent = "Your town remains available while the update downloads.";
          break;
        case "ready":
          this.title.textContent = `Pet Town ${snapshot?.availableVersion ?? "update"} is ready to install`;
          this.copy.textContent =
            "Downloaded and verified. Install & Restart only when you choose.";
          break;
        case "preparing":
          this.title.textContent = "Preparing to install…";
          this.copy.textContent = "Checking that Settings and Town are safe to close.";
          break;
        case "installing":
          this.title.textContent = "Installing update…";
          this.copy.textContent = "Pet Town will restart when installation finishes.";
          break;
        case "error":
          this.title.textContent = "Couldn’t check for updates";
          this.copy.textContent = snapshot?.error ?? "Check for updates again.";
          break;
        default:
          this.title.textContent = "Checking for updates…";
          this.copy.textContent = "Checking for a newer Pet Town release.";
      }
      if (snapshot?.error) this.copy.textContent = snapshot.error;
      if (error) this.copy.textContent = error;
    }

    const available = !unavailable && phase === "available";
    this.badge.hidden = !available;
    this.news.hidden = unavailable || !(snapshot?.availableVersion || phase === "current");
    this.news.href = snapshot?.availableVersion
      ? `https://github.com/abhishek944/pet-town/releases/tag/v${encodeURIComponent(snapshot.availableVersion)}`
      : "https://github.com/abhishek944/pet-town/releases/latest";
    this.check.hidden = unavailable;
    this.check.textContent =
      phase === "idle" || phase === "error" ? "Check for updates" : "Check again";
    this.check.disabled =
      locked ||
      phase === "checking" ||
      phase === "downloading" ||
      phase === "preparing" ||
      phase === "installing";
    this.download.hidden = unavailable || phase !== "available";
    this.download.disabled = locked;
    this.install.hidden = unavailable || phase !== "ready";
    this.install.disabled = locked || installPending;

    this.progressRow.hidden = phase !== "downloading";
    if (phase === "downloading" && snapshot) {
      const total = snapshot.totalBytes;
      if (total && total > 0) {
        this.progress.max = total;
        this.progress.value = snapshot.downloadedBytes;
        this.progressCopy.textContent = `${formatBytes(snapshot.downloadedBytes)} of ${formatBytes(total)}`;
      } else {
        this.progress.removeAttribute("value");
        this.progressCopy.textContent = `${formatBytes(snapshot.downloadedBytes)} downloaded`;
      }
    }
  }
}

function formatBytes(value: number): string {
  if (value < 1024) return `${Math.max(0, value)} B`;
  const units = ["KB", "MB", "GB"];
  let amount = value;
  let unit = -1;
  do {
    amount /= 1024;
    unit += 1;
  } while (amount >= 1024 && unit < units.length - 1);
  return `${amount.toFixed(amount < 10 ? 1 : 0)} ${units[unit]}`;
}
