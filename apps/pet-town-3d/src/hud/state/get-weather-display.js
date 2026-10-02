/** HUD context, state, DOM helpers, clock colors and weather display values. */
import { hudState } from "../state.js";
export function getWeatherDisplay(hours) {
  let toLowerCaseResult = String(
    hudState.hudContext.weather ?? hudState.hudContext.sky?.weather ?? `clear`,
  ).toLowerCase();
  let result = hours < 5.8 || hours > 19.2;
  return toLowerCaseResult.includes(`rain`) ||
    toLowerCaseResult.includes(`storm`) ||
    toLowerCaseResult.includes(`shower`)
    ? [`rain`, `Rainy`, `#cfe6ff`]
    : toLowerCaseResult.includes(`snow`)
      ? [`snow`, `Snowy`, `#e6f2ff`]
      : toLowerCaseResult.includes(`overcast`) ||
          toLowerCaseResult === `cloudy` ||
          toLowerCaseResult.includes(`fog`)
        ? [`cloud`, `Cloudy`, `#eef2f8`]
        : toLowerCaseResult.includes(`part`) || toLowerCaseResult.includes(`few`)
          ? result
            ? [`moon`, `Hazy`, `#e9e6ff`]
            : [`partly`, `Fair`, `#fff1c4`]
          : result
            ? [`moon`, `Starry`, `#e9e6ff`]
            : [`sun`, `Sunny`, `#fff1c4`];
}
