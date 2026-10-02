/** Player spawn, context API, fixed-step orchestration, effects, render interpolation and demo controls. */
import { playerState } from "../state.js";
export function emitPlayerParticles(value, cloneValue, value2) {
  let fx2 = playerState.playerRuntime.ctx.fx;
  if (fx2 && typeof fx2.burst == `function`) {
    try {
      fx2.burst(cloneValue.clone(), value, value2);
    } catch {}
  }
}
