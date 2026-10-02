import { skySunsetKeyframes } from "./sunset-keyframes.js";
import { skyDaytimeKeyframes } from "./daytime-keyframes.js";
import { skyNightAndDawnKeyframes } from "./night-dawn-keyframes.js";
/** Color and lighting keyframes and interpolation across the day/night cycle. */
import { skyState } from "../state.js";
import { createSkyDisplayColor } from "./create-sky-display-color.js";
export function prepareSkyDayCycle() {
  skyState.skyCycleKeyframes = [
    ...skyNightAndDawnKeyframes,
    ...skyDaytimeKeyframes,
    ...skySunsetKeyframes,
  ];
  skyState.skyCycleColorChannels = [
    `zenith`,
    `mid`,
    `midAnti`,
    `horizon`,
    `sunHz`,
    `glow`,
    `cLit`,
    `cShade`,
    `cRim`,
    `cir`,
    `sun`,
    `hSky`,
    `hGnd`,
  ];
  skyState.skyCycleScalarChannels = [`glowK`, `cirA`, `sunI`, `hI`, `fogN`, `fogF`, `stars`, `exp`];
  skyState.skyCycleSamples = skyState.skyCycleKeyframes.map((tValue) => {
    let options = {
      t: tValue.t,
    };
    for (let result of skyState.skyCycleColorChannels) {
      options[result] = createSkyDisplayColor(
        tValue[result] ?? (result === `midAnti` ? tValue.mid : 0),
      );
    }
    for (let result2 of skyState.skyCycleScalarChannels) {
      options[result2] = tValue[result2];
    }
    return options;
  });
}
