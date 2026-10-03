import { createBirdDefinition } from "../birds/create-bird-definition.js";

export function createDriftDefinition() {
  return createBirdDefinition({
    id: "drift",
    name: "Drift",
    count: 3,
    blurb: "An ivory gull with soft gray wing tips. Glides gently along the coast.",
    biomes: ["shore", "plains", "meadow"],
    flight: {
      activity: "day",
      pattern: "glide",
      minAltitude: 4.1,
      maxAltitude: 6,
      radius: 23,
      cruiseSpeed: 2.6,
      wingRate: 7.5,
      wingAmp: 0.48,
      glideEvery: 5.5,
      glideFor: 3.6,
    },
    palette: {
      back: 0xfff4dc,
      belly: 0xffeed2,
      throat: 0xfff4dc,
      wing: 0xb1b6c5,
      tip: 0x676d80,
      cover: 0xf2e1c5,
      face: 0xfffbeb,
      iris: 0xb57931,
      cheek: 0xf4aaa3,
      beak: 0xf2b855,
      beakTip: 0xce893c,
      foot: 0xb88143,
    },
  });
}
