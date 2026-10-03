import { FISH_SPECIES, WISH_CHOICES } from "./places.js";
import { journalArt } from "../activities/journal-art.js";

export function createWillowmereJournal(host, activities, collectionHost) {
  host.innerHTML = `<article class="sunmeadow-activity" data-fishing-card tabindex="-1">${journalArt("fish")}
    <h3>Willowmere fishing</h3><p class="journal-meta" data-experience-meta="willowmere-lake"></p><p data-fishing-note role="status" aria-live="polite"></p>
    <button type="button" class="sunmeadow-action" data-fishing>Cast your line</button>
    <button type="button" data-find-place="willowmere-lake">Find the lake</button><p class="sunmeadow-note" data-fish-count></p></article>
    <article class="sunmeadow-activity">${journalArt("lantern")}<h3>Wish lanterns</h3><p class="journal-meta" data-experience-meta="lantern-grove"></p><p data-wish-note></p>
    <div class="sunmeadow-wish-buttons"></div><button type="button" data-find-place="lantern-grove">Find the grove</button><p class="sunmeadow-note" data-wish-count></p></article>`;
  collectionHost.innerHTML = `<h3 class="journal-section-title">Fish you have met</h3><div class="journal-collection-grid" data-fish-collection></div><h3 class="journal-section-title">Wishes in the grove</h3><p class="sunmeadow-note" data-wish-collection></p>`;
  const fishRows = FISH_SPECIES.map((name) => {
    const card = document.createElement("div");
    card.className = "journal-keepsake";
    card.innerHTML = `${journalArt("fish")}<strong></strong><small></small>`;
    card.querySelector("strong").textContent = name;
    collectionHost.querySelector("[data-fish-collection]").append(card);
    return { name, card };
  });
  const query = (selector) => host.querySelector(selector);
  const fishButton = query("[data-fishing]");
  fishButton.onclick = () => activities.fish();
  const wishButtons = WISH_CHOICES.map((wish) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = wish;
    button.setAttribute("aria-label", `Hang a wish lantern for ${wish.toLowerCase()}`);
    button.onclick = () => activities.hang(wish);
    query(".sunmeadow-wish-buttons").append(button);
    return button;
  });
  return {
    update() {
      const state = activities.status;
      const labels = {
        idle: "Cast your line",
        waiting: "Waiting for a nibble…",
        nibble: "Reel now!",
        caught: "Gently release fish",
      };
      fishButton.textContent = `${labels[state.phase]}${state.phase === "nibble" ? ` · ${Math.max(0, state.remaining).toFixed(1)}s` : ""}`;
      fishButton.disabled = !state.canFish || state.phase === "waiting";
      query("[data-fishing-card]").dataset.nibble = String(state.phase === "nibble");
      const fishingNote = !state.fishSupported
        ? "Restore a level, dry fishing shore and leave the lake beneath the bobber clear of blocks."
        : state.canFish
          ? state.message
          : "Visit Willowmere Lake, choose Leave if following a companion, and open this journal beside the fishing rod. Closing the journal puts your cast away.";
      if (query("[data-fishing-note]").textContent !== fishingNote)
        query("[data-fishing-note]").textContent = fishingNote;
      query("[data-fish-count]").textContent =
        `${state.fish.length}/3 fish discovered · See your Collection page.`;
      for (const { name, card } of fishRows) {
        const found = state.fish.includes(name);
        card.dataset.found = String(found);
        card.querySelector("small").textContent = found
          ? "Discovered and gently released ✓"
          : "Still to meet at Willowmere Lake";
      }
      collectionHost.querySelector("[data-wish-collection]").textContent = state.lanterns.length
        ? `${state.lanterns.length}/8 wishes hung · ${state.lanterns.join(" · ")}`
        : "No wishes hung yet. Visit Lantern Grove to hang your first lantern.";
      query("[data-wish-note]").textContent = !state.lanternSupported
        ? "Restore level, dry ground beneath both lantern posts to see your saved wishes again."
        : state.lanterns.length === 8
          ? "Eight warm wishes light the grove. Come back at dusk to enjoy them."
          : state.canHang
            ? "Choose a wish to hang a warm lantern between the two wooden posts."
            : "Visit Lantern Grove and stand beside the two posts. Choose Leave if following a companion, then hang a wish.";
      query("[data-wish-count]").textContent =
        `${state.lanterns.length}/8 lanterns glowing · Your wishes are saved on this device.`;
      wishButtons.forEach((button) => {
        button.disabled = !state.canHang || state.lanterns.length >= 8;
      });
    },
  };
}
