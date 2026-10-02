/** Noise/reverb generation, audio graph and reusable oscillator/envelope instruments. */
import { audioState } from "../state.js";
import { clampAudioValue } from "../state/clamp-audio-value.js";
export function createPannedAudioGain(destination, pan = 0) {
  let gainResult = audioState.webAudioContext.createGain();
  if (((gainResult.gain.value = 0), pan)) {
    let stereoPannerResult = audioState.webAudioContext.createStereoPanner();
    stereoPannerResult.pan.value = clampAudioValue(pan, -1, 1);
    gainResult.connect(stereoPannerResult);
    stereoPannerResult.connect(destination);
    gainResult._p = stereoPannerResult;
  } else {
    gainResult.connect(destination);
  }
  return gainResult;
}
