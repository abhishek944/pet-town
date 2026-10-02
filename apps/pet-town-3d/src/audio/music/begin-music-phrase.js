/** Procedural pentatonic music, chord progressions, motif variation and scheduling. */
import { audioState } from "../state.js";
import { chooseAudioValue } from "../state/choose-audio-value.js";
import { createMusicMotif } from "./create-music-motif.js";
import { varyMusicMotifEnding } from "./vary-music-motif-ending.js";
export function beginMusicPhrase(nightAmount) {
  audioState.musicSequencerState.prog = chooseAudioValue(
    nightAmount > 0.5 ? audioState.nighttimeChordProgressions : audioState.daytimeChordProgressions,
  );
  let result = nightAmount > 0.5 ? 0.55 : 0.9;
  let musicMotifResult = createMusicMotif(result);
  let musicMotifResult2 = createMusicMotif(result);
  audioState.musicSequencerState.motifs = [
    musicMotifResult,
    varyMusicMotifEnding(musicMotifResult),
    musicMotifResult2,
    Math.random() < 0.3 ? null : musicMotifResult,
  ];
  if (++audioState.musicSequencerState.cycle % 3 == 0) {
    audioState.musicSequencerState.keyIdx = (audioState.musicSequencerState.keyIdx + 1) % 4;
    audioState.musicSequencerState.key =
      [0, 5, 2, 7][audioState.musicSequencerState.keyIdx] -
      (audioState.musicSequencerState.keyIdx === 3 ? 12 : 0);
  }
}
