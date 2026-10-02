/** HUD context, state, DOM helpers, clock colors and weather display values. */
import { hudState } from "../state.js";
export let playHudSound = (kind, options) => {
  try {
    hudState.hudContext.audio?.sfx?.(kind, options);
  } catch {}
};
