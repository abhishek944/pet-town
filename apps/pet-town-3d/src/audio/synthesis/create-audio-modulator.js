/** Noise/reverb generation, audio graph and reusable oscillator/envelope instruments. */
import { createScheduledOscillator } from "./create-scheduled-oscillator.js";
import { audioState } from "../state.js";
import { disconnectAudioNodesOnEnded } from "./disconnect-audio-nodes-on-ended.js";
export function createAudioModulator(frequency, amplitude, destination, startTime, stopTime) {
  let scheduledOscillatorResult = createScheduledOscillator(`sine`, frequency, startTime, stopTime);
  let gainResult = audioState.webAudioContext.createGain();
  gainResult.gain.value = amplitude;
  scheduledOscillatorResult.connect(gainResult);
  gainResult.connect(destination);
  disconnectAudioNodesOnEnded(scheduledOscillatorResult, gainResult);
  return scheduledOscillatorResult;
}
