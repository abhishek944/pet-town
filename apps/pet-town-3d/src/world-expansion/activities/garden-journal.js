import { getGardenSupport } from "./garden-support.js";
import { GARDEN_POSITION, distanceToPlace } from "./places.js";

export function updateGardenJournal(context, progress, query, ready) {
  const garden = progress.state.garden;
  const nearby = distanceToPlace(context.player.position, GARDEN_POSITION) <= 6;
  const supported = getGardenSupport(context.terrain) !== null;
  const labels = [
    "Plant flower seeds",
    "Water the seedlings",
    "Water for blossoms",
    "Flowers in bloom ✓",
  ];
  const notes = [
    "An empty bed, ready for six little flowers. Plant, then water twice to see them bloom.",
    "Seeds are tucked into the soil. A little water will bring out their first leaves.",
    "Small green stems and buds are growing. Water once more to open the blossoms.",
    "Coral, lavender, and golden flowers! They will still be here when you return.",
  ];
  query("[data-garden-note]").textContent = supported
    ? `${notes[garden]}${nearby ? "" : " Visit Picnic Garden and walk to the raised bed to tend it."}`
    : "The flower bed needs level, dry ground beneath every part of it. Restore the garden soil to see your flowers and tend them again.";
  const gardenButton = query("[data-garden]");
  gardenButton.textContent = labels[garden];
  gardenButton.disabled =
    !nearby || !supported || garden === 3 || !ready || !progress.gardenAvailable;
}
