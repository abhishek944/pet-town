/** Sound dispatch, volume/mute controls, browser unlock, buffer preparation and frame updates. */
import { audioState } from "../state.js";
import { clampAudioValue } from "../state/clamp-audio-value.js";
import { applyMasterAudioVolume } from "./apply-master-audio-volume.js";
import { saveAudioPreferences } from "../state/save-audio-preferences.js";
export function setAudioVolume(volume) {
  audioState.audioRuntime.volume = clampAudioValue(volume, 0, 1);
  applyMasterAudioVolume();
  saveAudioPreferences();
}
