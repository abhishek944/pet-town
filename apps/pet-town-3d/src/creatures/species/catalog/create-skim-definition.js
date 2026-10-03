import { createBirdDefinition } from "../birds/create-bird-definition.js";

export function createSkimDefinition() {
  return createBirdDefinition({
    id: "skim",
    name: "Skim",
    count: 3,
    blurb: "A blue swallow with a peach bib and forked tail. Flutters over the meadow.",
    biomes: ["meadow", "plains", "forest"],
    flight: {
      activity: "day",
      pattern: "dart",
      minAltitude: 3.6,
      maxAltitude: 5.8,
      radius: 16,
      cruiseSpeed: 3.5,
      wingRate: 15,
      wingAmp: 0.65,
      glideEvery: 6,
      glideFor: 1.1,
    },
    palette: {
      back: 0x7aabe0,
      belly: 0xffefd3,
      throat: 0xffbd92,
      wing: 0x7897c5,
      tip: 0x486487,
      cover: 0xe4d2b6,
      face: 0xfff5df,
      iris: 0xb97627,
      cheek: 0xf6a19c,
      beak: 0x64514b,
      beakTip: 0xc78369,
      foot: 0x6b5650,
    },
  });
}
