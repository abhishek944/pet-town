/** HUD context, state, DOM helpers, clock colors and weather display values. */
import { hudState } from "../state.js";
import { initializeHud } from "../lifecycle/initialize-hud.js";
import { updateHud } from "../lifecycle/update-hud.js";
export function prepareHudState() {
  hudState.hudModule = {
    get init() {
      return initializeHud;
    },
    get update() {
      return updateHud;
    },
  };
  hudState.hudElements = {};
  hudState.hudRuntime = {
    hidden: false,
    photoMode: false,
    photoBusy: false,
    capture: 0,
    help: false,
    splash: false,
    lastTime: ``,
    lastPeriod: ``,
    lastSel: -1,
    nameTimer: 0,
    day: 1,
    lastT: null,
    skyCss: ``,
    orbCss: ``,
    prompts: new Map(),
    petCooldown: 0,
    near: null,
    lastPhotoURL: null,
    retClass: ``,
  };
  hudState.clockSkyColorStops = [
    [0, `#1d2556`, `#3a3f7c`],
    [4.5, `#27306a`, `#5a4f8c`],
    [5.6, `#7f8fd6`, `#ffb08a`],
    [6.6, `#8fc3f2`, `#ffd9a8`],
    [8, `#6fbef7`, `#bfe6ff`],
    [16.5, `#6fbef7`, `#c8ebff`],
    [17.8, `#8fa6e6`, `#ffb98a`],
    [18.8, `#6a6bb8`, `#ff9a7a`],
    [19.8, `#34397a`, `#6a5a9a`],
    [21, `#1d2556`, `#3a3f7c`],
    [24, `#1d2556`, `#3a3f7c`],
  ];
}
