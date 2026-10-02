export const PET_CATALOG = [
  {
    id: "maple",
    name: "Maple",
    species: "Fox courier",
    description: "A rust-colored fox with a green scarf, a tiny satchel and a cream-tipped tail.",
    trait: "Curious · warm · quick-footed",
    colors: ["#dc8a4d", "#527b68", "#f4dfbd"],
  },
  {
    id: "clover",
    name: "Clover",
    species: "Rabbit gardener",
    description: "Long ears, a straw hat and a carrot tucked under one arm.",
    trait: "Gentle · bright · patient",
    colors: ["#e5d1b9", "#9eab77", "#d6b37a"],
  },
  {
    id: "juniper",
    name: "Juniper",
    species: "Cat librarian",
    description: "A blue-grey cat with a honey scarf and a pocket-sized book.",
    trait: "Thoughtful · quiet · clever",
    colors: ["#82989b", "#cd995d", "#426954"],
  },
  {
    id: "scout",
    name: "Scout",
    species: "Raccoon ranger",
    description: "A striped tail, a canvas bag and a little lantern for late-night walks.",
    trait: "Resourceful · playful · loyal",
    colors: ["#aca491", "#b35f45", "#697851"],
  },
  {
    id: "puddle",
    name: "Puddle",
    species: "Frog in a raincoat",
    description: "A moss-green frog with bright eyes and a honey-yellow raincoat.",
    trait: "Cheerful · curious · hopeful",
    colors: ["#9fba7a", "#d3a850", "#d8d694"],
  },
  {
    id: "moss",
    name: "Moss",
    species: "Mushroom wanderer",
    description: "A wide spotted cap, a woolly scarf and a tiny foraging basket.",
    trait: "Shy · observant · gentle",
    colors: ["#b76553", "#e4d6b4", "#8fa083"],
  },
  {
    id: "mossback",
    name: "Mossback",
    species: "Turtle scholar",
    description: "Round spectacles and a garden growing on a well-traveled shell.",
    trait: "Wise · patient · grounded",
    colors: ["#b5b988", "#756f47", "#977054"],
  },
  {
    id: "fern",
    name: "Fern",
    species: "Little deer",
    description: "Leafy antlers, cream spots and a small shoulder bag.",
    trait: "Quiet · graceful · attentive",
    colors: ["#c7a173", "#628473", "#e4d0a3"],
  },
];

export function getPetDefinition(id) {
  return PET_CATALOG.find((pet) => pet.id === id) ?? null;
}
