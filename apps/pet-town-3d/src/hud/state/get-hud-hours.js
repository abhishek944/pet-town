/** HUD context, state, DOM helpers, clock colors and weather display values. */
import { hudState } from "../state.js";
export let getHudHours = () =>
  ((((hudState.hudContext.sky?.hours == null
    ? (hudState.hudContext.timeOfDay ?? 0.4)
    : hudState.hudContext.sky.hours / 24) %
    1) +
    1) %
    1) *
  24;
