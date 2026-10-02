/** Sound dispatch, volume/mute controls, browser unlock, buffer preparation and frame updates. */
import { audioState } from "../state.js";
import { initializeAudioGraph } from "../synthesis/initialize-audio-graph.js";
import { prepareAudioBuffers } from "./prepare-audio-buffers.js";
import { applyMasterAudioVolume } from "./apply-master-audio-volume.js";
export function unlockAudio() {
  if (audioState.webAudioContext || initializeAudioGraph()) {
    if (audioState.webAudioContext.state !== `running`) {
      audioState.webAudioContext.resume().catch(() => {});
    }
    if (!audioState.audioRuntime.started) {
      audioState.audioRuntime.started = true;
      audioState.audioNodes.master.gain.setValueAtTime(0, audioState.webAudioContext.currentTime);
      applyMasterAudioVolume(0.7, 0.05);
      prepareAudioBuffers();
    }
  }
}
