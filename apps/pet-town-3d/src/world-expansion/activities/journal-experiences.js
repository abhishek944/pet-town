import { journalArt } from "./journal-art.js";
import { distanceToPlace, expansionRestored } from "./places.js";

const adventures = [
  {
    id: "lagoon",
    art: "dolphin",
    name: "Meet the dolphins",
    note: "Swim beside three curious dolphins at Dolphin Lagoon. Watch for a leap above the waves.",
    how: "Swim into the lagoon to earn its stamp.",
  },
  {
    id: "reef",
    art: "reef",
    name: "Dive into Coral Garden",
    note: "Little schools of fish weave through colourful coral and anemones.",
    how: "Go underwater near the reef to discover it.",
  },
  {
    id: "kelp",
    art: "kelp",
    name: "Wander the kelp forest",
    note: "Find swaying green fronds, a school of fish and two sea turtles.",
    how: "Dive into Swaying Kelp to earn its stamp.",
  },
  {
    id: "wreck",
    art: "wreck",
    name: "Find the sunken sailboat",
    note: "An old broken boat rests quietly on the seabed. Swim down and take a closer look.",
    how: "Explore the wreck underwater to discover it.",
  },
  {
    id: "island",
    art: "island",
    name: "Swim to Pearlrest Island",
    note: "A beach beyond the horizon, with palms and a picnic spot. Approach its stepped eastern shore.",
    how: "Step onto dry island ground to earn its stamp.",
  },
  {
    id: "harbor-launch",
    art: "ship",
    name: "Take the harbor launch",
    note: "A wooden boat waits west of Driftwood Camp. Climb aboard, walk the deck and take the helm for your own voyage.",
    how: "F to board or take / leave the helm. WASD steers. Get off onto clear shore or swim from an open side. No stamp required.",
    passive: true,
  },
  {
    id: "reef",
    art: "glow",
    name: "Swim through night glow",
    note: "Return after dusk to watch glowing plankton follow your swim through the sea.",
    how: "Enjoy the glow at night; no stamp or timer.",
    passive: true,
    dusk: true,
  },
];

export function createJournalExperiences(context, root, places, heading) {
  const host = root.querySelector("[data-extra-experiences]");
  const stars = document.createElement("article");
  stars.className = "sunmeadow-activity";
  stars.innerHTML = `${journalArt("stars")}<h3>A night at Stargazer Camp</h3><p class="journal-meta" data-experience-meta="camp">Best after dusk</p><p>Walk to the camp, listen to the island and watch the changing sky. Bring a view home with photo mode.</p><button type="button" data-find-place="camp">Find the camp</button>`;
  host.append(stars);
  const cards = adventures.map((adventure) => {
    const card = document.createElement("article");
    card.className = "sunmeadow-activity";
    card.hidden = true;
    card.innerHTML = `${journalArt(adventure.art)}<h3>${adventure.name}</h3><p class="journal-meta"></p><p>${adventure.note}</p><p class="sunmeadow-note">${adventure.how}</p><button type="button">Set a heading</button>`;
    card.querySelector("button").onclick = () => heading(adventure.id);
    card
      .querySelector("button")
      .setAttribute("aria-label", `Set heading for ${adventure.name.toLowerCase()}`);
    host.append(card);
    return { adventure, card };
  });
  const controls = document.createElement("aside");
  controls.className = "journal-controls";
  controls.hidden = true;
  controls.innerHTML = `<h3>A little swimming guide</h3><p>WASD to swim · Shift to swim faster<br>Hold Control to dive · Hold Space to rise<br>Release both to stay at depth. There is no oxygen timer.</p><p>Gamepad: X to dive, A to rise. Touch: hold Dive and the jump arrow to rise. Controlled companions can dive too.</p><p>Start at Driftwood Camp, then walk west to the sea. Choose a heading in Places and enjoy the journey.</p>`;
  host.append(controls);
  return {
    update() {
      for (const meta of root.querySelectorAll("[data-experience-meta]")) {
        const place = places.find((entry) => entry.id === meta.dataset.experienceMeta);
        if (!place) continue;
        const distance = distanceToPlace(context.player.position, place);
        const dusk = ["camp", "lantern-grove"].includes(place.id);
        meta.textContent = `${place.name} · ${distance <= 8 ? "Nearby" : `${Math.round(distance)}m away`}${dusk ? " · Best after dusk" : ""}`;
      }
      const api = context.water?.exploration;
      controls.hidden = !api;
      for (const { adventure, card } of cards) {
        card.hidden = !api;
        if (!api) continue;
        const place = api.places.find((entry) => entry.id === adventure.id);
        if (!place) {
          card.hidden = true;
          continue;
        }
        const distance = distanceToPlace(context.player.position, place);
        const found = api.discoveries.includes(place.id);
        card.querySelector(".journal-meta").textContent =
          `${place.name} · ${distance <= place.radius ? "Nearby" : `${Math.round(distance)}m away`}${adventure.dusk ? " · Best after dusk" : ""}${!adventure.passive && found ? " · Discovered ✓" : ""}`;
        card.querySelector("button").disabled = !expansionRestored(context);
      }
    },
  };
}
