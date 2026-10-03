import { WILLOWMERE_PLACES } from "../willowmere/places.js";
import { SHELLHAVEN_PLACES } from "../shellhaven/places.js";

/** Fixed authored destinations; their surroundings belong to the Sunmeadow layout. */
export const SUNMEADOW_PLACES = [
  {
    id: "gateway",
    name: "Sunmeadow Gate",
    x: 55,
    z: 0,
    icon: "☀",
    note: "Follow the winding path east into the new meadow.",
  },
  {
    id: "picnic",
    name: "Picnic Garden",
    x: 76,
    z: 16,
    icon: "✿",
    note: "Plant the little flower bed beside the picnic clearing.",
  },
  {
    id: "camp",
    name: "Stargazer Camp",
    x: 65,
    z: -22,
    icon: "☆",
    note: "Visit after dusk, listen to the island, and watch the sky.",
  },
  {
    id: "lookout",
    name: "Cloudrest Lookout",
    x: 102,
    z: -15,
    icon: "♧",
    note: "Turn toward the old town for a panorama. Orbit the camera, then take a photo.",
  },
  {
    id: "shore",
    name: "Sunpetal Shore",
    x: 101,
    z: 23,
    icon: "≈",
    note: "Walk along the water and frame the meadow against the sea.",
  },
];

export const GARDEN_POSITION = { x: 80, z: 20 };
export const distanceToPlace = (position, place) =>
  Math.hypot(position.x - place.x, position.z - place.z);

export function getTrailPlaces(context) {
  if (context.terrain.expansion?.stage >= 3)
    return [...SUNMEADOW_PLACES, ...WILLOWMERE_PLACES, ...SHELLHAVEN_PLACES];
  return context.terrain.expansion?.stage >= 2
    ? [...SUNMEADOW_PLACES, ...WILLOWMERE_PLACES]
    : SUNMEADOW_PLACES;
}

export function expansionRestored(context) {
  const persistence = context.building?.persistence;
  return !persistence?.on || persistence.loaded;
}
