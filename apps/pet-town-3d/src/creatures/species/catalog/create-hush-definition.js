import { createBirdDefinition } from "../birds/create-bird-definition.js";

export function createHushDefinition() {
  return createBirdDefinition({
    id: "hush",
    name: "Hush",
    count: 2,
    blurb: "A sleepy lilac owl with a cream heart face. Makes soft flights at dusk and night.",
    biomes: ["forest", "meadow", "plains"],
    flight: {
      activity: "night",
      pattern: "soft",
      minAltitude: 3.4,
      maxAltitude: 5.4,
      radius: 14,
      cruiseSpeed: 2,
      wingRate: 8.5,
      wingAmp: 0.52,
      glideEvery: 7,
      glideFor: 2.4,
    },
    palette: {
      back: 0xc2accc,
      belly: 0xefdfc7,
      throat: 0xefdfc7,
      wing: 0xb79dc1,
      tip: 0x95789e,
      cover: 0xddc9b4,
      face: 0xfff1dd,
      iris: 0x9770b8,
      cheek: 0xf5af9e,
      beak: 0xc1987b,
      beakTip: 0x8b674e,
      foot: 0x795c4e,
    },
  });
}
