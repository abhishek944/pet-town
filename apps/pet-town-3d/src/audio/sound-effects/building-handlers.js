/** Material-aware footsteps and gameplay/UI sound effect handlers. */
import { audioState } from "../state.js";
import { playOscillatorEnvelope } from "../synthesis/play-oscillator-envelope.js";
import { playNoiseEnvelope } from "../synthesis/play-noise-envelope.js";
import { randomAudioRange } from "../state/random-audio-range.js";
import { playBellNote } from "../synthesis/play-bell-note.js";
import { playMalletNote } from "../synthesis/play-mallet-note.js";
import { pentatonicDegreeToMidi } from "../music/pentatonic-degree-to-midi.js";
export function createBuildingSoundHandlers() {
  return {
    place(keyValue) {
      let currentTime2 = audioState.webAudioContext.currentTime;
      let key2 = keyValue?.key;
      let result = keyValue?.surface ?? `stone`;
      let result2 = performance.now();
      audioState.audioRuntime.placeRun =
        result2 - audioState.audioRuntime.lastPlace < 1300
          ? audioState.audioRuntime.placeRun + 1
          : 0;
      audioState.audioRuntime.lastPlace = result2;
      playOscillatorEnvelope(currentTime2, {
        f: 520,
        f2: 200,
        glide: 0.07,
        peak: 0.2,
        tau: 0.045,
      });
      playNoiseEnvelope(currentTime2, {
        type: `lowpass`,
        f: 2800,
        peak: 0.07,
        tau: 0.012,
      });
      playNoiseEnvelope(currentTime2, {
        f: audioState.surfaceSoundFrequencies[result] ?? 2e3,
        q: 1.2,
        peak: 0.06,
        tau: 0.02,
      });
      let result3 = Math.min(audioState.audioRuntime.placeRun, 9);
      playMalletNote(
        currentTime2 + 0.012,
        pentatonicDegreeToMidi(5 + result3, 72 + audioState.musicSequencerState.key),
        0.11,
        0,
        audioState.audioNodes.sfx,
      );
      if (key2 === `glass`) {
        playBellNote(
          currentTime2 + 0.02,
          96 + audioState.musicSequencerState.key,
          0.05,
          0,
          audioState.audioNodes.sfx,
        );
      }
      if (key2 === `lantern`) {
        [88, 91].forEach((value, value2) =>
          playBellNote(
            currentTime2 + 0.05 + value2 * 0.06,
            value + audioState.musicSequencerState.key,
            0.05,
            0,
            audioState.audioNodes.sfx,
          ),
        );
      }
    },
    break(surfaceValue) {
      let currentTime2 = audioState.webAudioContext.currentTime;
      let result = surfaceValue?.surface ?? `stone`;
      let result2 = audioState.surfaceSoundFrequencies[result] ?? 2e3;
      for (let index = 0; index < 3; index++) {
        playNoiseEnvelope(currentTime2 + index * randomAudioRange(0.018, 0.03), {
          f: result2 * randomAudioRange(0.75, 1.25),
          q: 1.3,
          peak: 0.15 * (1 - index * 0.25),
          tau: 0.025,
        });
      }
      if (
        (playNoiseEnvelope(currentTime2, {
          buf: audioState.audioNodes.brown,
          type: `lowpass`,
          f: 700,
          peak: 0.2,
          tau: 0.05,
        }),
        playOscillatorEnvelope(currentTime2, {
          f: 360,
          f2: 110,
          glide: 0.1,
          peak: 0.15,
          tau: 0.05,
        }),
        surfaceValue?.key === `glass`)
      ) {
        for (let index2 = 0; index2 < 6; index2++) {
          playOscillatorEnvelope(currentTime2 + randomAudioRange(0, 0.12), {
            f: randomAudioRange(2800, 6e3),
            peak: 0.03,
            tau: 0.04,
            pan: randomAudioRange(-0.5, 0.5),
          });
        }
      }
      if (result === `grass` || result === `leaves`) {
        playNoiseEnvelope(currentTime2 + 0.03, {
          buf: audioState.audioNodes.pink,
          f: 3500,
          q: 0.7,
          peak: 0.08,
          tau: 0.07,
        });
      }
    },
  };
}
