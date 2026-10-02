/** Wind, foliage, water, rain and bird/cricket/owl ambient audio. */
import { audioState } from "../state.js";
import { createAudioFilter } from "../synthesis/create-audio-filter.js";
import { playLoopingNoiseBuffer } from "../synthesis/play-looping-noise-buffer.js";
import { createAudioModulator } from "../synthesis/create-audio-modulator.js";
import { randomAudioRange } from "../state/random-audio-range.js";
export function initializeAmbientAudio() {
  let currentTime2 = audioState.webAudioContext.currentTime;
  audioState.ambientAudioState.wind = audioState.webAudioContext.createGain();
  audioState.ambientAudioState.wind.gain.value = 0;
  audioState.ambientAudioState.wind.connect(audioState.audioNodes.amb);
  audioState.ambientAudioState.windF = createAudioFilter(
    `bandpass`,
    500,
    0.55,
    audioState.ambientAudioState.wind,
  );
  playLoopingNoiseBuffer(
    audioState.audioNodes.brown,
    currentTime2,
    1e6,
    audioState.ambientAudioState.windF,
  );
  audioState.ambientAudioState.rustle = audioState.webAudioContext.createGain();
  audioState.ambientAudioState.rustle.gain.value = 0;
  audioState.ambientAudioState.rustle.connect(audioState.audioNodes.amb);
  let audioFilterResult = createAudioFilter(
    `highpass`,
    2600,
    0.5,
    audioState.ambientAudioState.rustle,
  );
  playLoopingNoiseBuffer(audioState.audioNodes.pink, currentTime2, 1e6, audioFilterResult, 0.9);
  audioState.ambientAudioState.brook = audioState.webAudioContext.createGain();
  audioState.ambientAudioState.brook.gain.value = 0;
  audioState.ambientAudioState.brook.connect(audioState.audioNodes.amb);
  let audioFilterResult2 = createAudioFilter(
    `bandpass`,
    1e3,
    3.2,
    createAudioFilter(`lowpass`, 3200, 0.4, audioState.ambientAudioState.brook),
  );
  playLoopingNoiseBuffer(audioState.audioNodes.white, currentTime2, 1e6, audioFilterResult2);
  let gainResult = audioState.webAudioContext.createGain();
  gainResult.gain.value = 42e3;
  gainResult.connect(audioFilterResult2.frequency);
  let audioFilterResult3 = createAudioFilter(`lowpass`, 14, 0.5, gainResult);
  playLoopingNoiseBuffer(audioState.audioNodes.white, currentTime2, 1e6, audioFilterResult3, 0.5);
  audioState.ambientAudioState.lap = audioState.webAudioContext.createGain();
  audioState.ambientAudioState.lap.gain.value = 0;
  audioState.ambientAudioState.lap.connect(audioState.audioNodes.amb);
  let audioFilterResult4 = createAudioFilter(`lowpass`, 420, 0.5);
  let gainResult2 = audioState.webAudioContext.createGain();
  gainResult2.gain.value = 0.6;
  audioFilterResult4.connect(gainResult2);
  gainResult2.connect(audioState.ambientAudioState.lap);
  createAudioModulator(0.13, 0.4, gainResult2.gain, currentTime2, currentTime2 + 1e6);
  playLoopingNoiseBuffer(audioState.audioNodes.brown, currentTime2, 1e6, audioFilterResult4);
  audioState.ambientAudioState.rain = audioState.webAudioContext.createGain();
  audioState.ambientAudioState.rain.gain.value = 0;
  audioState.ambientAudioState.rain.connect(audioState.audioNodes.amb);
  let audioFilterResult5 = createAudioFilter(
    `bandpass`,
    3800,
    0.35,
    audioState.ambientAudioState.rain,
  );
  playLoopingNoiseBuffer(audioState.audioNodes.pink, currentTime2, 1e6, audioFilterResult5, 1.1);
  audioState.ambientAudioState.crickets = [0, 1, 2].map((value2) => ({
    f: randomAudioRange(4100, 5200),
    pan: randomAudioRange(-0.8, 0.8),
    period: randomAudioRange(0.55, 0.95),
    next: currentTime2 + randomAudioRange(0, 1),
    pulses: 3 + (value2 % 2),
    gain: randomAudioRange(0.5, 1),
  }));
}
