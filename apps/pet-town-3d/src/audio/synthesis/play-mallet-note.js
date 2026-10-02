/** Noise/reverb generation, audio graph and reusable oscillator/envelope instruments. */
import { audioState } from "../state.js";
import { midiNoteFrequency } from "../state/midi-note-frequency.js";
import { clampAudioValue } from "../state/clamp-audio-value.js";
import { createPannedAudioGain } from "./create-panned-audio-gain.js";
import { disconnectAudioNodesOnEnded } from "./disconnect-audio-nodes-on-ended.js";
import { createScheduledOscillator } from "./create-scheduled-oscillator.js";
import { applyPercussionEnvelope } from "./apply-percussion-envelope.js";
import { playNoiseEnvelope } from "./play-noise-envelope.js";
export function playMalletNote(
  startTime,
  midiNote,
  volume = 0.12,
  pan = 0,
  destination = audioState.audioNodes.music,
) {
  let midiNoteFrequencyResult = midiNoteFrequency(midiNote);
  let clampAudioValueResult = clampAudioValue(
    0.42 * (220 / midiNoteFrequencyResult) ** 0.5,
    0.09,
    0.75,
  );
  let pannedAudioGainResult = createPannedAudioGain(destination, pan);
  disconnectAudioNodesOnEnded(
    createScheduledOscillator(
      `sine`,
      midiNoteFrequencyResult,
      startTime,
      applyPercussionEnvelope(
        pannedAudioGainResult,
        startTime,
        volume,
        clampAudioValueResult,
        0.0025,
      ),
      pannedAudioGainResult,
    ),
    pannedAudioGainResult,
  );
  let pannedAudioGainResult2 = createPannedAudioGain(destination, pan);
  let applyPercussionEnvelopeResult = applyPercussionEnvelope(
    pannedAudioGainResult2,
    startTime,
    volume * 0.28,
    clampAudioValueResult * 0.16,
    0.0015,
  );
  disconnectAudioNodesOnEnded(
    createScheduledOscillator(
      `sine`,
      midiNoteFrequencyResult * 3.93,
      startTime,
      applyPercussionEnvelopeResult,
      pannedAudioGainResult2,
    ),
    pannedAudioGainResult2,
  );
  playNoiseEnvelope(startTime, {
    f: Math.min(midiNoteFrequencyResult * 2.2, 4e3),
    q: 1.2,
    peak: volume * 0.06,
    tau: 0.008,
    a: 0.0015,
    dest: destination,
    pan: pan,
  });
}
