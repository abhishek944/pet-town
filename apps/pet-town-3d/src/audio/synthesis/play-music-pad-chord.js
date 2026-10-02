/** Noise/reverb generation, audio graph and reusable oscillator/envelope instruments. */
import { createPannedAudioGain } from "./create-panned-audio-gain.js";
import { audioState } from "../state.js";
import { createAudioFilter } from "./create-audio-filter.js";
import { createScheduledOscillator } from "./create-scheduled-oscillator.js";
import { midiNoteFrequency } from "../state/midi-note-frequency.js";
import { disconnectAudioNodesOnEnded } from "./disconnect-audio-nodes-on-ended.js";
export function playMusicPadChord(startTime, notes, duration, volume = 0.022) {
  for (let result of notes) {
    for (let result2 of [-7, 7]) {
      let pannedAudioGainResult = createPannedAudioGain(
        audioState.audioNodes.music,
        result2 * 0.03,
      );
      let audioFilterResult = createAudioFilter(`lowpass`, 1100, 0.4, pannedAudioGainResult);
      pannedAudioGainResult.gain.setValueAtTime(0, startTime);
      pannedAudioGainResult.gain.linearRampToValueAtTime(volume, startTime + 1.4);
      pannedAudioGainResult.gain.setValueAtTime(volume, startTime + duration);
      pannedAudioGainResult.gain.setTargetAtTime(0, startTime + duration, 0.7);
      let scheduledOscillatorResult = createScheduledOscillator(
        `triangle`,
        midiNoteFrequency(result),
        startTime,
        startTime + duration + 5,
        audioFilterResult,
      );
      scheduledOscillatorResult.detune.value = result2;
      disconnectAudioNodesOnEnded(
        scheduledOscillatorResult,
        audioFilterResult,
        pannedAudioGainResult,
      );
    }
  }
}
