/** Material-aware footsteps and gameplay/UI sound effect handlers. */
import { audioState } from "../state.js";
import { playOscillatorEnvelope } from "../synthesis/play-oscillator-envelope.js";
import { playNoiseEnvelope } from "../synthesis/play-noise-envelope.js";
import { playMalletNote } from "../synthesis/play-mallet-note.js";
import { pentatonicDegreeToMidi } from "../music/pentatonic-degree-to-midi.js";
export function createEditingSoundHandlers() {
  return {
    deny() {
      let currentTime2 = audioState.webAudioContext.currentTime;
      playOscillatorEnvelope(currentTime2, {
        f: 240,
        type: `triangle`,
        peak: 0.07,
        tau: 0.04,
        dest: audioState.audioNodes.ui,
      });
      playOscillatorEnvelope(currentTime2 + 0.09, {
        f: 190,
        type: `triangle`,
        peak: 0.07,
        tau: 0.05,
        dest: audioState.audioNodes.ui,
      });
    },
    undo() {
      let currentTime2 = audioState.webAudioContext.currentTime;
      playOscillatorEnvelope(currentTime2, {
        f: 900,
        f2: 360,
        glide: 0.12,
        peak: 0.07,
        tau: 0.06,
        dest: audioState.audioNodes.ui,
      });
      playNoiseEnvelope(currentTime2, {
        buf: audioState.audioNodes.pink,
        f: 2e3,
        sweep: 700,
        peak: 0.04,
        tau: 0.06,
        dest: audioState.audioNodes.ui,
      });
    },
    redo() {
      let currentTime2 = audioState.webAudioContext.currentTime;
      playOscillatorEnvelope(currentTime2, {
        f: 360,
        f2: 900,
        glide: 0.12,
        peak: 0.07,
        tau: 0.06,
        dest: audioState.audioNodes.ui,
      });
    },
    select(indexValue) {
      let currentTime2 = audioState.webAudioContext.currentTime;
      playMalletNote(
        currentTime2,
        pentatonicDegreeToMidi(
          5 + (indexValue?.index ?? 0),
          67 + audioState.musicSequencerState.key,
        ),
        0.075,
        0,
        audioState.audioNodes.ui,
      );
      playOscillatorEnvelope(currentTime2, {
        f: 1800,
        peak: 0.02,
        tau: 0.01,
        dest: audioState.audioNodes.ui,
      });
    },
    click() {
      playOscillatorEnvelope(audioState.webAudioContext.currentTime, {
        f: 1500,
        f2: 900,
        glide: 0.02,
        peak: 0.06,
        tau: 0.015,
        dest: audioState.audioNodes.ui,
      });
    },
  };
}
