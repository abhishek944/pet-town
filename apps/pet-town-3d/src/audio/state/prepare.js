/** Audio settings, note scale, randomness and persisted sound preferences. */
import { audioState } from "../state.js";
import { initializeAudio } from "../lifecycle/initialize-audio.js";
import { updateAudio } from "../lifecycle/update-audio.js";
import { clampAudioValue } from "./clamp-audio-value.js";
export function prepareAudioState() {
  audioState.audioModule = {
    get init() {
      return initializeAudio;
    },
    get update() {
      return updateAudio;
    },
  };
  audioState.webAudioContext = null;
  audioState.audioRuntime = {
    volume: 0.75,
    muted: false,
    started: false,
    music: true,
    placeRun: 0,
    lastPlace: 0,
    lastStep: 0,
  };
  audioState.audioNodes = {};
  audioState.musicPentatonicScale = [0, 2, 4, 7, 9];
  try {
    let e = JSON.parse(localStorage.getItem(`pk-audio`) ?? `{}`);
    if (typeof e.volume == `number`) {
      audioState.audioRuntime.volume = clampAudioValue(e.volume, 0, 1);
    }
    audioState.audioRuntime.muted = !!e.muted;
  } catch {}
}
