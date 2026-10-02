/** Material-aware footsteps and gameplay/UI sound effect handlers. */
import { audioState } from "../state.js";
import { randomAudioRange } from "../state/random-audio-range.js";
import { playNoiseEnvelope } from "../synthesis/play-noise-envelope.js";
import { playOscillatorEnvelope } from "../synthesis/play-oscillator-envelope.js";
export function playFootstepSound(surface, running = false, side = 0, strength = 1) {
  let result = audioState.webAudioContext.currentTime + 0.004;
  let result2 = (running ? 1.15 : 1) * strength * randomAudioRange(0.85, 1.1);
  let result3 = side * 0.14;
  let randomAudioRangeResult = randomAudioRange(0.9, 1.12);
  switch (surface) {
    case `grass`:
    case `leaves`:
      playNoiseEnvelope(result, {
        buf: audioState.audioNodes.pink,
        f: 2600 * randomAudioRangeResult,
        q: 0.8,
        peak: 0.16 * result2,
        tau: 0.04,
        a: 0.006,
        pan: result3,
      });
      playNoiseEnvelope(result + 0.012, {
        buf: audioState.audioNodes.white,
        type: `highpass`,
        f: 4200,
        q: 0.5,
        peak: 0.035 * result2,
        tau: 0.025,
        pan: result3,
      });
      playOscillatorEnvelope(result, {
        f: 120 * randomAudioRangeResult,
        f2: 70,
        glide: 0.05,
        peak: 0.1 * result2,
        tau: 0.03,
        pan: result3,
      });
      break;
    case `dirt`:
      playNoiseEnvelope(result, {
        buf: audioState.audioNodes.brown,
        type: `lowpass`,
        f: 900 * randomAudioRangeResult,
        q: 0.6,
        peak: 0.35 * result2,
        tau: 0.04,
        pan: result3,
      });
      playOscillatorEnvelope(result, {
        f: 95 * randomAudioRangeResult,
        f2: 55,
        glide: 0.06,
        peak: 0.16 * result2,
        tau: 0.035,
        pan: result3,
      });
      break;
    case `gravel`:
    case `snow`:
      for (let index = 0; index < 4; index++) {
        playNoiseEnvelope(result + index * randomAudioRange(0.01, 0.02), {
          f:
            (surface === `snow` ? 1700 : 3200) *
            randomAudioRangeResult *
            randomAudioRange(0.8, 1.2),
          q: 1.4,
          peak: 0.09 * result2 * (1 - index * 0.15),
          tau: 0.018,
          pan: result3,
        });
      }
      playOscillatorEnvelope(result, {
        f: 90,
        f2: 60,
        peak: 0.1 * result2,
        tau: 0.03,
        pan: result3,
      });
      break;
    case `sand`:
      playNoiseEnvelope(result, {
        buf: audioState.audioNodes.pink,
        f: 4200 * randomAudioRangeResult,
        q: 0.6,
        peak: 0.14 * result2,
        tau: 0.06,
        a: 0.018,
        pan: result3,
      });
      playOscillatorEnvelope(result, {
        f: 85,
        f2: 55,
        peak: 0.07 * result2,
        tau: 0.03,
        pan: result3,
      });
      break;
    case `wood`:
      playOscillatorEnvelope(result, {
        f: 190 * randomAudioRangeResult,
        f2: 140,
        glide: 0.07,
        peak: 0.2 * result2,
        tau: 0.055,
        pan: result3,
      });
      playOscillatorEnvelope(result, {
        f: 380 * randomAudioRangeResult,
        type: `triangle`,
        peak: 0.05 * result2,
        tau: 0.025,
        pan: result3,
      });
      playNoiseEnvelope(result, {
        type: `lowpass`,
        f: 1800,
        peak: 0.08 * result2,
        tau: 0.012,
        pan: result3,
      });
      break;
    case `glass`:
      playOscillatorEnvelope(result, {
        f: 2500 * randomAudioRangeResult,
        peak: 0.035 * result2,
        tau: 0.05,
        pan: result3,
      });
      playOscillatorEnvelope(result, {
        f: 3720 * randomAudioRangeResult,
        peak: 0.02 * result2,
        tau: 0.035,
        pan: result3,
      });
      playNoiseEnvelope(result, {
        f: 3e3,
        q: 2,
        peak: 0.06 * result2,
        tau: 0.01,
        pan: result3,
      });
      break;
    case `water`:
      playNoiseEnvelope(result, {
        f: 700,
        sweep: 2200,
        q: 1.5,
        peak: 0.14 * result2,
        tau: 0.05,
        pan: result3,
      });
      playOscillatorEnvelope(result + 0.02, {
        f: randomAudioRange(450, 700),
        f2: randomAudioRange(900, 1300),
        glide: 0.05,
        peak: 0.04 * result2,
        tau: 0.03,
        pan: result3,
      });
      break;
    default:
      playNoiseEnvelope(result, {
        f: 2700 * randomAudioRangeResult,
        q: 1.8,
        peak: 0.13 * result2,
        tau: 0.018,
        pan: result3,
      });
      playOscillatorEnvelope(result, {
        f: 230 * randomAudioRangeResult,
        f2: 180,
        peak: 0.06 * result2,
        tau: 0.025,
        pan: result3,
      });
      playNoiseEnvelope(result, {
        buf: audioState.audioNodes.brown,
        type: `lowpass`,
        f: 600,
        peak: 0.12 * result2,
        tau: 0.03,
        pan: result3,
      });
  }
}
