/** Procedural pentatonic music, chord progressions, motif variation and scheduling. */
import { audioState } from "../state.js";
import { scheduleMusicStep } from "./schedule-music-step.js";
export function updateMusicSequencer(nightAmount) {
  let currentTime2 = audioState.webAudioContext.currentTime;
  for (
    audioState.musicSequencerState.bpm +=
      (82 - 18 * nightAmount - audioState.musicSequencerState.bpm) * 0.01,
      audioState.musicSequencerState.next < currentTime2 - 0.08 &&
        (audioState.musicSequencerState.next = currentTime2 + 0.06);
    audioState.musicSequencerState.next < currentTime2 + 0.22;
  ) {
    if (audioState.audioRuntime.music) {
      scheduleMusicStep(
        audioState.musicSequencerState.step,
        audioState.musicSequencerState.next,
        nightAmount,
      );
    }
    audioState.musicSequencerState.next += 60 / audioState.musicSequencerState.bpm / 2;
    audioState.musicSequencerState.step++;
  }
}
