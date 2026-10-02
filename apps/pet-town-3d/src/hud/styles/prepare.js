/** HUD stylesheet. */
import sourceAsset74 from "./assets/prepare-hud-styles-section-1-74.css?raw";
import sourceAsset75 from "./assets/prepare-hud-styles-section-2-75.css?raw";
import townHudStyles from "./assets/town-hud.css?raw";
import welcomeStyles from "./assets/welcome.css?raw";
import { hudState } from "../state.js";
export function prepareHudStyles() {
  hudState.hudStyles =
    sourceAsset74 +
    String(
      Array.from(
        {
          length: 24,
        },
        (value, value2) => {
          let result = (value2 / 24) * Math.PI * 2;
          return `${(Math.cos(result) * 7).toFixed(1)}px ${(Math.sin(result) * 7).toFixed(1)}px 0 #fff`;
        },
      ).join(`,`),
    ) +
    sourceAsset75 +
    townHudStyles +
    welcomeStyles;
}
