/** Procedural pentatonic music, chord progressions, motif variation and scheduling. */
import { clampAudioValue } from "../state/clamp-audio-value.js";
import { chooseAudioValue } from "../state/choose-audio-value.js";
export function varyMusicMotifEnding(motif) {
  let values = motif.map((value) => ({
    ...value,
  }));
  for (let result = Math.max(0, values.length - 2); result < values.length; result++) {
    values[result].idx = clampAudioValue(
      values[result].idx + chooseAudioValue([-2, -1, 1, 2]),
      3,
      12,
    );
  }
  return values;
}
