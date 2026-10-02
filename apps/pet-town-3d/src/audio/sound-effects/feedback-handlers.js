/** Material-aware footsteps and gameplay/UI sound effect handlers. */
import { audioState } from "../state.js";
import { playOscillatorEnvelope } from "../synthesis/play-oscillator-envelope.js";
import { playNoiseEnvelope } from "../synthesis/play-noise-envelope.js";
import { randomAudioRange } from "../state/random-audio-range.js";
import { playBellNote } from "../synthesis/play-bell-note.js";
import { playMalletNote } from "../synthesis/play-mallet-note.js";
export function createFeedbackSoundHandlers() {
  return {
    pet() {
      let currentTime2 = audioState.webAudioContext.currentTime;
      [84, 88, 91, 96].forEach((value, value2) =>
        playBellNote(
          currentTime2 + value2 * 0.075,
          value + audioState.musicSequencerState.key,
          0.09,
          randomAudioRange(-0.2, 0.2),
          audioState.audioNodes.ui,
        ),
      );
      playOscillatorEnvelope(currentTime2 + 0.02, {
        f: 600,
        f2: 1100,
        glide: 0.09,
        peak: 0.06,
        tau: 0.06,
        dest: audioState.audioNodes.ui,
      });
    },
    toast() {
      let currentTime2 = audioState.webAudioContext.currentTime;
      playBellNote(
        currentTime2,
        88 + audioState.musicSequencerState.key,
        0.05,
        0,
        audioState.audioNodes.ui,
      );
      playBellNote(
        currentTime2 + 0.09,
        95 + audioState.musicSequencerState.key,
        0.045,
        0,
        audioState.audioNodes.ui,
      );
    },
    banner() {
      let currentTime2 = audioState.webAudioContext.currentTime;
      [72, 76, 79, 84, 88].forEach((value, value2) =>
        playMalletNote(
          currentTime2 + value2 * 0.08,
          value + audioState.musicSequencerState.key,
          0.08,
          (value2 - 2) * 0.15,
          audioState.audioNodes.ui,
        ),
      );
    },
    open() {
      let currentTime2 = audioState.webAudioContext.currentTime;
      playMalletNote(
        currentTime2,
        79 + audioState.musicSequencerState.key,
        0.07,
        0,
        audioState.audioNodes.ui,
      );
      playMalletNote(
        currentTime2 + 0.07,
        84 + audioState.musicSequencerState.key,
        0.07,
        0,
        audioState.audioNodes.ui,
      );
    },
    close() {
      let currentTime2 = audioState.webAudioContext.currentTime;
      playMalletNote(
        currentTime2,
        84 + audioState.musicSequencerState.key,
        0.06,
        0,
        audioState.audioNodes.ui,
      );
      playMalletNote(
        currentTime2 + 0.07,
        79 + audioState.musicSequencerState.key,
        0.06,
        0,
        audioState.audioNodes.ui,
      );
    },
    shutter() {
      let currentTime2 = audioState.webAudioContext.currentTime;
      playNoiseEnvelope(currentTime2, {
        type: `highpass`,
        f: 2500,
        peak: 0.12,
        tau: 0.02,
        dest: audioState.audioNodes.ui,
      });
      playOscillatorEnvelope(currentTime2, {
        f: 1300,
        peak: 0.05,
        tau: 0.01,
        dest: audioState.audioNodes.ui,
      });
      playNoiseEnvelope(currentTime2 + 0.085, {
        f: 3e3,
        q: 1.5,
        peak: 0.08,
        tau: 0.015,
        dest: audioState.audioNodes.ui,
      });
      playOscillatorEnvelope(currentTime2 + 0.085, {
        f: 900,
        peak: 0.04,
        tau: 0.012,
        dest: audioState.audioNodes.ui,
      });
    },
    start() {
      let currentTime2 = audioState.webAudioContext.currentTime;
      [72, 76, 79, 83, 86, 91].forEach((value, value2) =>
        playBellNote(
          currentTime2 + value2 * 0.06,
          value,
          0.07,
          (value2 - 2.5) * 0.12,
          audioState.audioNodes.ui,
        ),
      );
    },
  };
}
