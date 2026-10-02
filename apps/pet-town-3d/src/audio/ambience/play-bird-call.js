/** Wind, foliage, water, rain and bird/cricket/owl ambient audio. */
import { createPannedAudioGain } from "../synthesis/create-panned-audio-gain.js";
import { audioState } from "../state.js";
import { chooseAudioValue } from "../state/choose-audio-value.js";
import { randomAudioRange } from "../state/random-audio-range.js";
import { createScheduledOscillator } from "../synthesis/create-scheduled-oscillator.js";
import { disconnectAudioNodesOnEnded } from "../synthesis/disconnect-audio-nodes-on-ended.js";
import { createAudioModulator } from "../synthesis/create-audio-modulator.js";
export function playBirdCall(startTime, pan, volume) {
  let pannedAudioGainResult = createPannedAudioGain(audioState.audioNodes.amb, pan);
  pannedAudioGainResult.gain.value = volume;
  let chooseAudioValueResult = chooseAudioValue([`tweet`, `tweet`, `trill`, `whistle`, `chirp`]);
  let randomAudioRangeResult = randomAudioRange(2600, 4300);
  let value2Value = startTime;
  let callback = (value5, value6, value7, value8, value9) => {
    let gainResult = audioState.webAudioContext.createGain();
    gainResult.gain.value = 0;
    gainResult.connect(pannedAudioGainResult);
    gainResult.gain.setValueAtTime(0, value5);
    gainResult.gain.linearRampToValueAtTime(value9, value5 + 0.008);
    gainResult.gain.setTargetAtTime(0, value5 + value8 * 0.5, value8 * 0.25);
    let scheduledOscillatorResult = createScheduledOscillator(
      `sine`,
      value6,
      value5,
      value5 + value8 * 2.5,
      gainResult,
    );
    scheduledOscillatorResult.frequency.exponentialRampToValueAtTime(value7, value5 + value8);
    disconnectAudioNodesOnEnded(scheduledOscillatorResult, gainResult);
    value2Value = Math.max(value2Value, value5 + value8 * 2.5);
  };
  if (chooseAudioValueResult === `tweet`) {
    let result = 2 + ((Math.random() * 3) | 0);
    for (let index = 0; index < result; index++) {
      callback(
        startTime + index * randomAudioRange(0.1, 0.14),
        randomAudioRangeResult,
        randomAudioRangeResult * randomAudioRange(1.2, 1.45),
        0.07,
        0.55,
      );
    }
  } else if (chooseAudioValueResult === `chirp`) {
    for (let index2 = 0; index2 < 3; index2++) {
      callback(
        startTime + index2 * 0.07,
        randomAudioRangeResult * 1.5,
        randomAudioRangeResult * 0.95,
        0.045,
        0.5,
      );
    }
  } else if (chooseAudioValueResult === `whistle`) {
    callback(startTime, randomAudioRangeResult * 0.8, randomAudioRangeResult * 0.82, 0.24, 0.4);
    callback(
      startTime + 0.3,
      randomAudioRangeResult * 0.66,
      randomAudioRangeResult * 0.64,
      0.26,
      0.38,
    );
  } else {
    let gainResult2 = audioState.webAudioContext.createGain();
    gainResult2.connect(pannedAudioGainResult);
    gainResult2.gain.setValueAtTime(0, startTime);
    gainResult2.gain.linearRampToValueAtTime(0.4, startTime + 0.03);
    gainResult2.gain.setValueAtTime(0.4, startTime + 0.35);
    gainResult2.gain.setTargetAtTime(0, startTime + 0.35, 0.04);
    let scheduledOscillatorResult2 = createScheduledOscillator(
      `sine`,
      randomAudioRangeResult,
      startTime,
      startTime + 0.6,
      gainResult2,
    );
    createAudioModulator(
      randomAudioRange(22, 32),
      randomAudioRangeResult * 0.09,
      scheduledOscillatorResult2.frequency,
      startTime,
      startTime + 0.6,
    );
    disconnectAudioNodesOnEnded(scheduledOscillatorResult2, gainResult2);
    value2Value = startTime + 0.6;
  }
  setTimeout(
    () => {
      pannedAudioGainResult.disconnect();
      pannedAudioGainResult._p?.disconnect();
    },
    (value2Value - audioState.webAudioContext.currentTime + 0.5) * 1e3,
  );
}
