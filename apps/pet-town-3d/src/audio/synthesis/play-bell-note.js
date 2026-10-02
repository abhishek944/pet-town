/** Noise/reverb generation, audio graph and reusable oscillator/envelope instruments. */
import { audioState } from "../state.js";
import { midiNoteFrequency } from "../state/midi-note-frequency.js";
import { clampAudioValue } from "../state/clamp-audio-value.js";
import { createPannedAudioGain } from "./create-panned-audio-gain.js";
import { disconnectAudioNodesOnEnded } from "./disconnect-audio-nodes-on-ended.js";
import { createScheduledOscillator } from "./create-scheduled-oscillator.js";
import { applyPercussionEnvelope } from "./apply-percussion-envelope.js";
export function playBellNote(
  startTime,
  midiNote,
  volume = 0.15,
  pan = 0,
  destination = audioState.audioNodes.music,
) {
  let midiNoteFrequencyResult = midiNoteFrequency(midiNote);
  let clampAudioValueResult = clampAudioValue(
    0.95 * (523 / midiNoteFrequencyResult) ** 0.45,
    0.28,
    1.5,
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
        0.003,
      ),
      pannedAudioGainResult,
    ),
    pannedAudioGainResult,
  );
  let pannedAudioGainResult2 = createPannedAudioGain(destination, pan);
  let applyPercussionEnvelopeResult = applyPercussionEnvelope(
    pannedAudioGainResult2,
    startTime,
    volume * 0.22,
    clampAudioValueResult * 0.5,
    0.002,
  );
  if (
    (disconnectAudioNodesOnEnded(
      createScheduledOscillator(
        `sine`,
        midiNoteFrequencyResult * 2,
        startTime,
        applyPercussionEnvelopeResult,
        pannedAudioGainResult2,
      ),
      pannedAudioGainResult2,
    ),
    midiNoteFrequencyResult * 6.27 < 11e3)
  ) {
    let pannedAudioGainResult3 = createPannedAudioGain(destination, pan);
    let applyPercussionEnvelopeResult2 = applyPercussionEnvelope(
      pannedAudioGainResult3,
      startTime,
      volume * 0.1,
      0.045,
      0.002,
    );
    disconnectAudioNodesOnEnded(
      createScheduledOscillator(
        `sine`,
        midiNoteFrequencyResult * 6.27,
        startTime,
        applyPercussionEnvelopeResult2,
        pannedAudioGainResult3,
      ),
      pannedAudioGainResult3,
    );
  }
}
