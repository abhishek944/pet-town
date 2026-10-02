/** Noise/reverb generation, audio graph and reusable oscillator/envelope instruments. */
import { audioState } from "../state.js";
export function createScheduledOscillator(waveform, frequency, startTime, stopTime, destination) {
  let oscillatorResult = audioState.webAudioContext.createOscillator();
  oscillatorResult.type = waveform;
  oscillatorResult.frequency.setValueAtTime(frequency, startTime);
  if (destination) {
    oscillatorResult.connect(destination);
  }
  oscillatorResult.start(startTime);
  oscillatorResult.stop(stopTime);
  return oscillatorResult;
}
