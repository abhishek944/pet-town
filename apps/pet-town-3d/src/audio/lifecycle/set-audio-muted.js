/** Sound dispatch, volume/mute controls, browser unlock, buffer preparation and frame updates. */
import { audioState } from "../state.js";
import { applyMasterAudioVolume } from "./apply-master-audio-volume.js";
import { saveAudioPreferences } from "../state/save-audio-preferences.js";
export function setAudioMuted(muted) {
  audioState.audioRuntime.muted = !!muted;
  applyMasterAudioVolume();
  saveAudioPreferences();
}
