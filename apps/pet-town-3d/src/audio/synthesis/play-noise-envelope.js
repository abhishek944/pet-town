/** Noise/reverb generation, audio graph and reusable oscillator/envelope instruments. */
import { audioState } from "../state.js";
import { createPannedAudioGain } from "./create-panned-audio-gain.js";
import { createAudioFilter } from "./create-audio-filter.js";
import { applyPercussionEnvelope } from "./apply-percussion-envelope.js";
import { disconnectAudioNodesOnEnded } from "./disconnect-audio-nodes-on-ended.js";
import { playLoopingNoiseBuffer } from "./play-looping-noise-buffer.js";
export function playNoiseEnvelope(
  startTime,
  {
    buf: buffer = audioState.audioNodes.white,
    type: filterType = `bandpass`,
    f: frequency = 2e3,
    q: resonance = 1,
    peak = 0.2,
    tau: decay = 0.03,
    a: attack = 0.003,
    sweep: sweepFrequency,
    dest: destination = audioState.audioNodes.sfx,
    pan = 0,
    rate: playbackRate = 1,
  },
) {
  if (!buffer) {
    return startTime;
  }
  let gainNode = createPannedAudioGain(destination, pan);
  let filter = createAudioFilter(filterType, frequency, resonance, gainNode);
  if (sweepFrequency) {
    filter.frequency.setValueAtTime(frequency, startTime);
    filter.frequency.exponentialRampToValueAtTime(sweepFrequency, startTime + decay * 3);
  }
  let stopTime = applyPercussionEnvelope(gainNode, startTime, peak, decay, attack);
  disconnectAudioNodesOnEnded(
    playLoopingNoiseBuffer(buffer, startTime, stopTime - startTime, filter, playbackRate),
    filter,
    gainNode,
  );
  return stopTime;
}
