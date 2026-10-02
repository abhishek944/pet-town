/** Procedural pentatonic music, chord progressions, motif variation and scheduling. */
import { clampAudioValue } from "../state/clamp-audio-value.js";
import { chooseAudioValue } from "../state/choose-audio-value.js";
export function createMusicMotif(density) {
  let values = [];
  let result = 5 + ((Math.random() * 4) | 0);
  for (let index = 0; index < 16; index++) {
    let result2 = (index % 4 == 0 ? 0.7 : index % 2 == 0 ? 0.42 : 0.16) * density;
    if (Math.random() < result2 || (index === 0 && Math.random() < 0.5)) {
      result = clampAudioValue(
        result + chooseAudioValue([-2, -1, -1, 0, 1, 1, 2, -3, 3].slice(0, density > 0.7 ? 9 : 7)),
        3,
        12,
      );
      values.push({
        s: index,
        idx: result,
        v: index % 4 == 0 ? 1 : 0.75,
      });
    }
  }
  return values.length < 3 ? createMusicMotif(density) : values;
}
