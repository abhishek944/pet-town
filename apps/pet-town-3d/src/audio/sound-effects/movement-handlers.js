/** Material-aware footsteps and gameplay/UI sound effect handlers. */
import { audioState } from "../state.js";
import { playFootstepSound } from "./play-footstep-sound.js";
import { getFootstepSurface } from "./get-footstep-surface.js";
import { playOscillatorEnvelope } from "../synthesis/play-oscillator-envelope.js";
import { playNoiseEnvelope } from "../synthesis/play-noise-envelope.js";
import { clampAudioValue } from "../state/clamp-audio-value.js";
import { randomAudioRange } from "../state/random-audio-range.js";
import { playBellNote } from "../synthesis/play-bell-note.js";
export function createMovementSoundHandlers() {
  return {
    step(posValue) {
      let currentTime2 = audioState.webAudioContext.currentTime;
      if (!(currentTime2 - audioState.audioRuntime.lastStep < 0.09)) {
        audioState.audioRuntime.lastStep = currentTime2;
        playFootstepSound(
          getFootstepSurface(posValue?.pos ?? audioState.audioGameContext.player?.position),
          !!posValue?.run,
          posValue?.side ?? 0,
        );
      }
    },
    jump(fromWaterValue) {
      let currentTime2 = audioState.webAudioContext.currentTime;
      if (fromWaterValue?.fromWater) {
        audioState.soundEffectHandlers.splash({
          speed: 3,
        });
        return;
      }
      playOscillatorEnvelope(currentTime2, {
        f: 300,
        f2: 640,
        glide: 0.11,
        peak: 0.08,
        tau: 0.06,
      });
      playNoiseEnvelope(currentTime2, {
        buf: audioState.audioNodes.pink,
        f: 700,
        sweep: 2e3,
        q: 0.9,
        peak: 0.07,
        tau: 0.05,
      });
    },
    land(impactValue) {
      let clampAudioValueResult = clampAudioValue((impactValue?.impact ?? 6) / 12, 0.15, 1.3);
      let currentTime2 = audioState.webAudioContext.currentTime;
      playOscillatorEnvelope(currentTime2, {
        f: 110,
        f2: 42,
        glide: 0.14,
        peak: 0.22 * clampAudioValueResult,
        tau: 0.06,
      });
      playFootstepSound(
        getFootstepSurface(audioState.audioGameContext.player?.position),
        true,
        0,
        0.8 + clampAudioValueResult * 0.6,
      );
    },
    splash(speedValue) {
      let currentTime2 = audioState.webAudioContext.currentTime;
      let clampAudioValueResult = clampAudioValue((speedValue?.speed ?? 4) / 8, 0.3, 1.2);
      playNoiseEnvelope(currentTime2, {
        f: 1600,
        sweep: 450,
        q: 0.9,
        peak: 0.22 * clampAudioValueResult,
        tau: 0.09,
      });
      playNoiseEnvelope(currentTime2, {
        buf: audioState.audioNodes.brown,
        type: `lowpass`,
        f: 500,
        peak: 0.25 * clampAudioValueResult,
        tau: 0.12,
      });
      for (let index = 0; index < 5; index++) {
        playOscillatorEnvelope(currentTime2 + randomAudioRange(0.03, 0.25), {
          f: randomAudioRange(500, 900),
          f2: randomAudioRange(1100, 1800),
          glide: 0.04,
          peak: 0.035 * clampAudioValueResult,
          tau: 0.025,
          pan: randomAudioRange(-0.4, 0.4),
        });
      }
    },
    paddle() {
      let currentTime2 = audioState.webAudioContext.currentTime;
      playNoiseEnvelope(currentTime2, {
        f: 900,
        sweep: 1800,
        q: 1.2,
        peak: 0.06,
        tau: 0.05,
      });
      playOscillatorEnvelope(currentTime2, {
        f: randomAudioRange(500, 700),
        f2: 1100,
        peak: 0.025,
        tau: 0.03,
      });
    },
    glide() {
      let currentTime2 = audioState.webAudioContext.currentTime;
      playNoiseEnvelope(currentTime2, {
        buf: audioState.audioNodes.pink,
        f: 500,
        sweep: 1400,
        q: 0.7,
        peak: 0.09,
        tau: 0.18,
        a: 0.06,
      });
      playBellNote(
        currentTime2,
        84 + audioState.musicSequencerState.key,
        0.05,
        0,
        audioState.audioNodes.sfx,
      );
    },
    respawn() {
      let currentTime2 = audioState.webAudioContext.currentTime;
      [72, 76, 79, 84].forEach((value, value2) =>
        playBellNote(
          currentTime2 + value2 * 0.07,
          value + audioState.musicSequencerState.key,
          0.07,
          0,
          audioState.audioNodes.sfx,
        ),
      );
    },
  };
}
