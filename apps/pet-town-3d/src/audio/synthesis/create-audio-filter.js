/** Noise/reverb generation, audio graph and reusable oscillator/envelope instruments. */
import { audioState } from "../state.js";
export function createAudioFilter(type, frequency, resonance = 0.7, destination) {
  let biquadFilterResult = audioState.webAudioContext.createBiquadFilter();
  biquadFilterResult.type = type;
  biquadFilterResult.frequency.value = frequency;
  biquadFilterResult.Q.value = resonance;
  if (destination) {
    biquadFilterResult.connect(destination);
  }
  return biquadFilterResult;
}
