/** Noise/reverb generation, audio graph and reusable oscillator/envelope instruments. */
import { audioState } from "../state.js";
import { createPannedAudioGain } from "./create-panned-audio-gain.js";
import { createScheduledOscillator } from "./create-scheduled-oscillator.js";
import { applyPercussionEnvelope } from "./apply-percussion-envelope.js";
import { disconnectAudioNodesOnEnded } from "./disconnect-audio-nodes-on-ended.js";
export function playOscillatorEnvelope(
  startTime,
  {
    f: value3 = 440,
    f2: value2,
    glide: value4 = 0.08,
    type: value5 = `sine`,
    peak: value6 = 0.15,
    tau: value7 = 0.06,
    a: value8 = 0.003,
    dest: value9 = audioState.audioNodes.sfx,
    pan: value10 = 0,
  },
) {
  let pannedAudioGainResult = createPannedAudioGain(value9, value10);
  let scheduledOscillatorResult = createScheduledOscillator(
    value5,
    value3,
    startTime,
    applyPercussionEnvelope(pannedAudioGainResult, startTime, value6, value7, value8),
    pannedAudioGainResult,
  );
  if (value2) {
    scheduledOscillatorResult.frequency.exponentialRampToValueAtTime(value2, startTime + value4);
  }
  disconnectAudioNodesOnEnded(scheduledOscillatorResult, pannedAudioGainResult);
  return scheduledOscillatorResult;
}
