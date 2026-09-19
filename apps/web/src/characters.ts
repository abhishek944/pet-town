export type Character = { id: string; name: string; description: string; image: string };
type CharacterDetails = Omit<Character, "image">;

const characterDetails: CharacterDetails[] = [
  {
    id: "bao-panda-chef",
    name: "Bao Panda Chef",
    description: "Waddles through the village and gets busy chopping bamboo.",
  },
  {
    id: "bigfoot-yeti",
    name: "Bigfoot Yeti",
    description: "Brings gentle giant energy to every mountain of work.",
  },
  {
    id: "brassbell-automaton-porter",
    name: "Brassbell Automaton Porter",
    description: "Sorts every parcel and keeps the village deliveries moving.",
  },
  {
    id: "cat",
    name: "Tabby Cat",
    description: "Finds the warmest corner and supervises every open tab.",
  },
  {
    id: "dog",
    name: "Dog",
    description: "Bounds into each task with loyal, tail-wagging enthusiasm.",
  },
  {
    id: "ember-fox-ronin",
    name: "Ember Fox Ronin",
    description: "Keeps a watchful eye on the work, blade close at hand.",
  },
  {
    id: "fern-potted-plant",
    name: "Fern Potted Plant",
    description: "Adds a little green calm while good ideas take root.",
  },
  {
    id: "gus-mail-carrier",
    name: "Gus Mail Carrier",
    description: "Carries every message through the village right on schedule.",
  },
  {
    id: "human-male",
    name: "Human Adventurer",
    description: "Takes on the next objective with steady, practical focus.",
  },
  {
    id: "jun-clockwork-apprentice",
    name: "Jun Clockwork Apprentice",
    description: "Tunes tiny mechanisms and keeps his clockwork bird in flight.",
  },
  {
    id: "kip-penguin-postman",
    name: "Kip Penguin Postman",
    description: "Waddles every important update safely to its destination.",
  },
  {
    id: "mira-dune-spear-scout",
    name: "Mira Dune Spear Scout",
    description: "Maps the route ahead and scouts for the next clear path.",
  },
  {
    id: "mossback-turtle-monk",
    name: "Mossback Turtle Monk",
    description: "Takes the patient path and carries a tiny village garden.",
  },
  {
    id: "nib-dragon-hatchling",
    name: "Nib Dragon Hatchling",
    description: "Tackles big ideas with tiny wings and bright curiosity.",
  },
  {
    id: "pebble-slime-knight",
    name: "Pebble Slime Knight",
    description: "Faces daunting quests with a brave heart and trusty spoon.",
  },
  {
    id: "pudge-hedgehog",
    name: "Pudge Hedgehog",
    description: "Scurries through the small details without missing a step.",
  },
  {
    id: "skiff-raccoon-sky-pirate",
    name: "Skiff Raccoon Sky Pirate",
    description: "Charts a daring course through even the messiest task list.",
  },
  {
    id: "sol-capybara",
    name: "Sol Capybara",
    description: "Keeps the village grounded with an unhurried, sunny outlook.",
  },
  {
    id: "viking",
    name: "Viking",
    description: "Meets stubborn problems with a sturdy hammer and resolve.",
  },
  {
    id: "wisp-little-ghost",
    name: "Wisp Little Ghost",
    description: "Floats quietly nearby and offers excellent moral support.",
  },
];

const walkImages = import.meta.glob("../../pet-town/src/pets/*/walk.png", {
  eager: true,
  import: "default",
  query: "?url",
}) as Record<string, string>;

export const characters: Character[] = characterDetails.map((details) => {
  const image = walkImages[`../../pet-town/src/pets/${details.id}/walk.png`];
  if (!image) throw new Error(`Missing bundled character preview for ${details.id}`);
  return { ...details, image };
});
