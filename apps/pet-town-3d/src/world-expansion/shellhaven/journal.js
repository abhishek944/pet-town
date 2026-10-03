import { COAST_SHELLS } from "./places.js";
import { journalArt } from "../activities/journal-art.js";

export function createShellhavenJournal(host, activities, collectionHost) {
  host.innerHTML = `<article class="sunmeadow-activity">${journalArt("shell")}<h3>Shellhaven shell hunt</h3><p class="journal-meta" data-experience-meta="shell-cove"></p>
    <p data-shell-note></p><button type="button" class="sunmeadow-action" data-collect-shell>Find a nearby shell</button>
    <button type="button" data-find-place="shell-cove">Find the cove</button><p class="sunmeadow-note" data-shell-count></p></article>`;
  collectionHost.innerHTML = `<h3 class="journal-section-title">Your coastal shells</h3><div data-shell-list></div><p class="sunmeadow-note" data-display-note></p>`;
  const query = (selector) =>
    host.querySelector(selector) ?? collectionHost.querySelector(selector);
  const collect = query("[data-collect-shell]");
  collect.onclick = () => activities.collect();
  const rows = COAST_SHELLS.map((shell) => {
    const row = document.createElement("div");
    row.className = "sunmeadow-place";
    row.innerHTML = `<span class="sunmeadow-stamp" aria-hidden="true">❋</span><div class="sunmeadow-place-copy"><strong></strong><small></small></div><button type="button">Feature</button>`;
    row.querySelector("strong").textContent = shell.name;
    row.querySelector(".sunmeadow-stamp").style.backgroundColor =
      `#${shell.color.toString(16).padStart(6, "0")}`;
    const button = row.querySelector("button");
    button.setAttribute("aria-label", `Feature ${shell.name} on the display shelf`);
    button.onclick = () => activities.feature(shell.id);
    query("[data-shell-list]").append(row);
    return { shell, row, button, note: row.querySelector("small") };
  });
  return {
    update() {
      const state = activities.status;
      collect.textContent = state.nearby ? `Collect ${state.nearby.name}` : "Find a nearby shell";
      collect.disabled = !state.canCollect || !state.nearby;
      query("[data-shell-count]").textContent =
        `${state.shells.length}/6 shells collected · Every shell has its own spot on your cove shelf.`;
      query("[data-shell-note]").textContent = !state.available
        ? "Shellhaven progress is unavailable. Existing discoveries have been kept; check device storage and reload."
        : state.nearby
          ? `A ${state.nearby.name} is close enough to collect. Choose Leave if following a companion, then keep this journal open and choose Collect.`
          : state.shells.length === 6
            ? "The whole coast is in your collection! Visit the display shelf just south of Shell Cove and feature your favorite."
            : "Six colorful shells lie along the dry coastal walks. Follow their gentle sparkles, walk close, then open J to collect. Shells need level, dry ground to appear.";
      query("[data-display-note]").textContent = !state.displaySupported
        ? "Restore level, dry ground beneath the whole cove shelf to see your saved collection again."
        : "Your wooden display stands just south of Shell Cove. Stand beside it to feature a collected shell; a small golden sparkle marks your favorite.";
      for (const { shell, row, button, note } of rows) {
        const found = state.shells.includes(shell.id);
        row.dataset.visited = String(found);
        note.textContent = found ? "Collected · On your Shell Cove display" : shell.hint;
        button.textContent = state.favorite === shell.id ? "Featured ✓" : "Feature";
        button.disabled = !found || !state.canFeature || state.favorite === shell.id;
      }
    },
  };
}
