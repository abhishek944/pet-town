/** Sound dispatch, volume/mute controls, browser unlock, buffer preparation and frame updates. */
import { audioState } from "../state.js";
export function playSoundEffect(kind, options) {
  if (
    !audioState.webAudioContext ||
    !audioState.audioRuntime.started ||
    audioState.webAudioContext.state === `closed`
  ) {
    return;
  }
  let result = audioState.soundEffectHandlers[kind];
  if (result) {
    try {
      result(options);
    } catch (result2) {
      console.warn(`[audio] sfx`, kind, result2);
    }
  }
}
