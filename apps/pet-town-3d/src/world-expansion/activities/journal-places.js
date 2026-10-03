import { distanceToPlace, expansionRestored } from "./places.js";

export function createJournalPlaces(context, root, progress, places, actions, heading) {
  const landHost = root.querySelector(".sunmeadow-places");
  const oceanHost = root.querySelector("[data-ocean-rows]");
  function createRow(place, water) {
    const row = document.createElement("div");
    row.className = "sunmeadow-place";
    row.tabIndex = -1;
    row.dataset.destination = `${water ? "water-" : ""}${place.id}`;
    row.innerHTML = `<span class="sunmeadow-stamp" aria-hidden="true"></span><div class="sunmeadow-place-copy"><strong></strong><small></small><p class="sunmeadow-note"></p></div><button type="button"></button>`;
    row.querySelector(".sunmeadow-stamp").textContent = place.icon ?? "≈";
    row.querySelector("strong").textContent = place.name;
    row.querySelector("p").textContent = place.note;
    const button = row.querySelector("button");
    button.textContent = water ? "Head this way" : "Visit →";
    button.setAttribute("aria-label", `${water ? "Set heading" : "Travel"} to ${place.name}`);
    button.onclick = () => (water ? heading(place.id) : actions.travel(place));
    (water ? oceanHost : landHost).append(row);
    return { place, water, row, button, status: row.querySelector("small") };
  }
  const rows = places.map((place) => createRow(place, false));
  let ocean = null;
  return {
    focus(id) {
      const entry = rows.find(({ place, water }) => !water && place.id === id);
      if (!entry) return;
      (entry.button.disabled ? entry.row : entry.button).focus();
      entry.row.scrollIntoView({ block: "nearest" });
    },
    update() {
      const api = context.water?.exploration;
      if (api !== ocean) {
        rows.filter((entry) => entry.water).forEach((entry) => entry.row.remove());
        rows.splice(places.length);
        ocean = api;
        if (api) rows.push(...api.places.map((place) => createRow(place, true)));
      }
      root.querySelector("[data-ocean-places]").hidden = !api;
      const ready = expansionRestored(context);
      const followed = Boolean(context.petTown?.controller.selected);
      for (const { place, water, row, button, status } of rows) {
        const visited = (water ? api.discoveries : progress.state.stamps).includes(place.id);
        row.dataset.visited = String(visited);
        const dx = place.x - context.player.position.x,
          dz = place.z - context.player.position.z;
        const direction =
          `${dz < -5 ? "N" : dz > 5 ? "S" : ""}${dx > 5 ? "E" : dx < -5 ? "W" : ""}` || "Here";
        status.textContent = `${place.transport ? "Boat" : visited ? "Stamped" : "Undiscovered"} · ${Math.round(distanceToPlace(context.player.position, place))}m ${direction}${water && api.headingId === place.id ? " · Current heading" : ""}`;
        button.disabled = !ready || (!water && followed);
      }
      root.querySelector("[data-travel-note]").textContent = followed
        ? "Choose Leave in Companions for land travel. You can follow ocean headings while controlling your companion."
        : ready
          ? "Visit travels to clear, dry ground with your explorer. Ocean headings guide your swim."
          : "Waiting for your saved world to load…";
    },
  };
}
