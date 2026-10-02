/** Player spawn, context API, fixed-step orchestration, effects, render interpolation and demo controls. */
import { playerState } from "../state.js";
import { emitPlayerParticles } from "./emit-player-particles.js";
export function emitPlayerWaterEffect(value, position, value2 = 1) {
  let water2 = playerState.playerRuntime.ctx.water;
  try {
    if (value === `splash` && typeof water2?.splash == `function`) {
      water2.splash(position.clone(), value2);
      return;
    }
    if (value === `ripple` && typeof water2?.ripple == `function`) {
      water2.ripple(position.x, position.z, value2);
      return;
    }
  } catch {}
  emitPlayerParticles(value === `ripple` ? `ripple` : `splash`, position, {
    count: Math.round(3 + value2 * 6),
    scale: 0.5 + value2 * 0.4,
  });
}
