/** Player spawn, context API, fixed-step orchestration, effects, render interpolation and demo controls. */
import { playerState } from "../state.js";
export function dispatchPlayerEvent(value, value2) {
  let result = playerState.playerRuntime.events.get(value);
  if (result) {
    for (let result2 of result) {
      try {
        result2(value2);
      } catch (result3) {
        console.warn(`[player] listener`, result3);
      }
    }
  }
  let audio2 = playerState.playerRuntime.ctx.audio;
  try {
    (audio2?.play ?? audio2?.sfx)?.call(audio2, value, value2);
  } catch {}
}
