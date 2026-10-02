/** Audio settings, note scale, randomness and persisted sound preferences. */
import { clampAudioValue } from "./clamp-audio-value.js";
export let audioSmoothstep = (start, end, value) => {
  let clampAudioValueResult = clampAudioValue((value - start) / (end - start), 0, 1);
  return clampAudioValueResult * clampAudioValueResult * (3 - 2 * clampAudioValueResult);
};
