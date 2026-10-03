import { journalArt } from "./journal-art.js";

export function createJournalCollection(context, root, progress, places) {
  const host = root.querySelector("[data-place-collection]");
  const garden = root.querySelector("[data-garden-collection]");
  garden.innerHTML = `<div class="journal-keepsake">${journalArt("garden")}<strong>Your picnic garden</strong><p class="sunmeadow-note"></p></div>`;
  let ocean;
  const entries = [];
  function rebuild() {
    host.replaceChildren();
    entries.length = 0;
    for (const [water, group] of [
      [false, places],
      [true, ocean?.places ?? []],
    ]) {
      for (const place of group) {
        const card = document.createElement("div");
        card.className = "journal-keepsake";
        card.innerHTML = `<span class="sunmeadow-stamp" aria-hidden="true"></span><strong></strong><small></small>`;
        card.querySelector("span").textContent = place.icon ?? "≈";
        card.querySelector("strong").textContent = place.name;
        host.append(card);
        entries.push({ card, place, water });
      }
    }
  }
  rebuild();
  return {
    update() {
      if (ocean !== context.water?.exploration) {
        ocean = context.water?.exploration;
        rebuild();
      }
      const stage = progress.state.garden;
      garden.querySelector(".journal-keepsake").dataset.found = String(stage === 3);
      garden.querySelector("p").textContent = [
        "An empty bed, ready for a beginning.",
        "Seeds planted · 1/3",
        "Seedlings growing · 2/3",
        "Flowers in bloom · 3/3",
      ][stage];
      for (const { card, place, water } of entries) {
        const found = (water ? ocean.discoveries : progress.state.stamps).includes(place.id);
        card.dataset.found = String(found);
        card.querySelector("small").textContent =
          `${water ? "Ocean" : "Island trail"} · ${found ? "Discovery stamp ✓" : "Still to discover"}`;
      }
    },
  };
}
