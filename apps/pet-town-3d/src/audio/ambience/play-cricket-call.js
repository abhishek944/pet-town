/** Wind, foliage, water, rain and bird/cricket/owl ambient audio. */
import { createPannedAudioGain } from "../synthesis/create-panned-audio-gain.js";
import { audioState } from "../state.js";
import { disconnectAudioNodesOnEnded } from "../synthesis/disconnect-audio-nodes-on-ended.js";
import { createScheduledOscillator } from "../synthesis/create-scheduled-oscillator.js";
export function playCricketCall(cricket, startTime, volume) {
  let pannedAudioGainResult = createPannedAudioGain(audioState.audioNodes.amb, cricket.pan);
  disconnectAudioNodesOnEnded(
    createScheduledOscillator(
      `sine`,
      cricket.f,
      startTime,
      startTime + cricket.pulses * 0.045 + 0.05,
      pannedAudioGainResult,
    ),
    pannedAudioGainResult,
  );
  for (let index = 0; index < cricket.pulses; index++) {
    let result = startTime + index * 0.042;
    pannedAudioGainResult.gain.setValueAtTime(0, result);
    pannedAudioGainResult.gain.linearRampToValueAtTime(volume, result + 0.005);
    pannedAudioGainResult.gain.linearRampToValueAtTime(0, result + 0.02);
  }
}
