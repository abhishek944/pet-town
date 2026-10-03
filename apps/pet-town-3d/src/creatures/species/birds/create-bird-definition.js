import { buildBirdCreature } from "./build-bird-creature.js";

/** Shared native-wildlife rig contract; species files own palettes and flight rhythms. */
export function createBirdDefinition({ id, name, blurb, biomes, count, flight, palette }) {
  return {
    id,
    name,
    blurb,
    biomes,
    count,
    build: (colors) => buildBirdCreature(colors, id),
    scale: 1.3,
    radius: 0.3,
    height: 0.96,
    headY: 0.64,
    sleepPose: "fluff",
    gait: "fly",
    walk: 0.75,
    run: flight.cruiseSpeed,
    bob: 0,
    flyAlt: [flight.minAltitude, flight.maxAltitude],
    flight,
    traits: {
      flyer: 1,
      lazy: 0.25,
      curious: 0.5,
      shy: 0.4,
      playful: 0.4,
      social: 0.5,
      energy: 0.75,
      nightOwl: flight.activity === "night" ? 1 : 0,
    },
    emotes: ["heart", "note", "music2"],
    variants: [palette],
  };
}
