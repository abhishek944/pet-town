/** Sound dispatch, volume/mute controls, browser unlock, buffer preparation and frame updates. */
import { audioState } from "../state.js";
export function applyMasterAudioVolume(transitionTime = 0.08, startDelay = 0) {
  const context = audioState.webAudioContext;
  const gain = audioState.audioNodes.master?.gain;
  if (!context || !gain) return;

  const now = context.currentTime;
  const currentGain = gain.value;
  const target = audioState.audioRuntime.muted ? 0 : audioState.audioRuntime.volume;
  // Replace queued unlock fades as well as previous mute/volume transitions.
  gain.cancelScheduledValues(now);
  if (target === 0 || transitionTime <= 0) {
    gain.setValueAtTime(target, now);
    return;
  }
  gain.setValueAtTime(currentGain, now);
  gain.setTargetAtTime(target, now + startDelay, transitionTime);
}
