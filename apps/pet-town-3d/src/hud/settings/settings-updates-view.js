/** @typedef {{revision:number,phase:'idle'|'checking'|'current'|'available'|'downloading'|'ready'|'preparing'|'installing'|'error',currentVersion:string,availableVersion:string|null,notes:string|null,downloadedBytes:number,totalBytes:number|null,error:string|null}} UpdateSnapshot */

export class TownSettingsUpdatesView {
  constructor(root, handlers) {
    this.root = root;
    this.check = root.querySelector("[data-update-check]");
    this.download = root.querySelector("[data-update-download]");
    this.install = root.querySelector("[data-update-install]");
    this.check.addEventListener("click", handlers.check);
    this.download.addEventListener("click", handlers.download);
    this.install.addEventListener("click", handlers.install);
  }

  /** @param {UpdateSnapshot|null} snapshot */
  render(snapshot, unavailable, error, locked, installPending) {
    const title = this.root.querySelector("[data-update-title]");
    const copy = this.root.querySelector("[data-update-copy]");
    const badge = this.root.querySelector("[data-update-badge]");
    const news = this.root.querySelector("[data-update-news]");
    const progressRow = this.root.querySelector("[data-update-progress-row]");
    const progress = this.root.querySelector("[data-update-progress]");
    const progressCopy = this.root.querySelector("[data-update-progress-copy]");
    const phase = snapshot?.phase;

    if (unavailable) {
      title.textContent = "App updates require Pet Town desktop";
      copy.textContent = "Open this town in Pet Town desktop to check and install updates.";
    } else {
      switch (phase) {
        case "idle":
          title.textContent = "Check for updates";
          copy.textContent = `Current version ${snapshot.currentVersion}.`;
          break;
        case "checking":
          title.textContent = "Checking for updates…";
          copy.textContent = "Checking for a newer Pet Town release.";
          break;
        case "current":
          title.textContent = "Pet Town is up to date";
          copy.textContent = `You have version ${snapshot.currentVersion}.`;
          break;
        case "available":
          title.textContent = `Pet Town ${snapshot.availableVersion} is available`;
          copy.textContent = `You have version ${snapshot.currentVersion}. Restart only when you choose.`;
          break;
        case "downloading":
          title.textContent = `Downloading Pet Town ${snapshot.availableVersion ?? "update"}…`;
          copy.textContent = "Your town remains available while the update downloads.";
          break;
        case "ready":
          title.textContent = `Pet Town ${snapshot.availableVersion ?? "update"} is ready to install`;
          copy.textContent = "Downloaded and verified. Install & Restart only when you choose.";
          break;
        case "preparing":
          title.textContent = "Preparing to install…";
          copy.textContent = "Saving the town and checking that Settings is safe to close.";
          break;
        case "installing":
          title.textContent = "Installing update…";
          copy.textContent = "Pet Town will restart when installation finishes.";
          break;
        case "error":
          title.textContent = "Couldn’t check for updates";
          copy.textContent = snapshot.error ?? "Check for updates again.";
          break;
        default:
          title.textContent = "Checking for updates…";
          copy.textContent = "Checking for a newer Pet Town release.";
      }
      if (snapshot?.error) copy.textContent = snapshot.error;
      if (error) copy.textContent = error;
    }

    badge.hidden = unavailable || phase !== "available";
    news.hidden = unavailable || !(snapshot?.availableVersion || phase === "current");
    news.href = snapshot?.availableVersion
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

    progressRow.hidden = phase !== "downloading";
    if (phase === "downloading" && snapshot) {
      const total = snapshot.totalBytes;
      if (total && total > 0) {
        progress.max = total;
        progress.value = snapshot.downloadedBytes;
        progressCopy.textContent = `${formatBytes(snapshot.downloadedBytes)} of ${formatBytes(total)}`;
      } else {
        progress.removeAttribute("value");
        progressCopy.textContent = `${formatBytes(snapshot.downloadedBytes)} downloaded`;
      }
    }
  }
}

function formatBytes(value) {
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
