/** Wind, foliage, water, rain and bird/cricket/owl ambient audio. */
import { createPannedAudioGain } from "../synthesis/create-panned-audio-gain.js";
import { audioState } from "../state.js";
import { createAudioFilter } from "../synthesis/create-audio-filter.js";
import { createScheduledOscillator } from "../synthesis/create-scheduled-oscillator.js";
import { disconnectAudioNodesOnEnded } from "../synthesis/disconnect-audio-nodes-on-ended.js";
export function playOwlCall(startTime) {
  let callback = (value2, value3) => {
    let pannedAudioGainResult = createPannedAudioGain(audioState.audioNodes.amb, -0.5);
    let audioFilterResult = createAudioFilter(`lowpass`, 900, 0.5, pannedAudioGainResult);
    let scheduledOscillatorResult = createScheduledOscillator(
      `sine`,
      390,
      value2,
      value2 + value3 + 0.4,
      audioFilterResult,
    );
    scheduledOscillatorResult.frequency.setValueAtTime(410, value2);
    scheduledOscillatorResult.frequency.exponentialRampToValueAtTime(350, value2 + value3);
    pannedAudioGainResult.gain.setValueAtTime(0, value2);
    pannedAudioGainResult.gain.linearRampToValueAtTime(0.05, value2 + 0.06);
    pannedAudioGainResult.gain.setTargetAtTime(0, value2 + value3 * 0.6, value3 * 0.25);
    disconnectAudioNodesOnEnded(
      scheduledOscillatorResult,
      audioFilterResult,
      pannedAudioGainResult,
    );
  };
  callback(startTime, 0.35);
  callback(startTime + 0.7, 0.18);
  callback(startTime + 0.95, 0.4);
}
