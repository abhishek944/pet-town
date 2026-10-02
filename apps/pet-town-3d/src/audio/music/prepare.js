/** Procedural pentatonic music, chord progressions, motif variation and scheduling. */
import { audioState } from "../state.js";
export function prepareAudioMusic() {
  audioState.musicChordVoicings = {
    0: [0, 4, 7, 14],
    1: [2, 5, 9, 12],
    3: [5, 9, 12, 16],
    4: [7, 11, 14, 16],
    5: [9, 12, 16, 19],
  };
  audioState.daytimeChordProgressions = [
    [0, 5, 3, 4],
    [0, 3, 5, 4],
    [3, 4, 0, 5],
    [0, 4, 5, 3],
    [0, 3, 0, 4],
  ];
  audioState.nighttimeChordProgressions = [
    [5, 3, 0, 4],
    [5, 1, 3, 4],
    [3, 0, 5, 4],
  ];
  audioState.musicSequencerState = {
    next: 0,
    step: 0,
    bpm: 80,
    prog: audioState.daytimeChordProgressions[0],
    motifs: [],
    phrase: 0,
    key: 0,
    keyIdx: 0,
    cycle: 0,
  };
}
