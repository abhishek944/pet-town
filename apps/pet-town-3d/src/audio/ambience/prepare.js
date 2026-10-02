/** Wind, foliage, water, rain and bird/cricket/owl ambient audio. */
import { audioState } from "../state.js";
export function prepareAudioAmbience() {
  audioState.ambientAudioState = {
    wind: null,
    windF: null,
    rustle: null,
    brook: null,
    lap: null,
    rain: null,
    gust: 0.5,
    gustT: 0,
    nextBird: 0,
    crickets: [],
    nextOwl: 0,
    waterProx: 0,
    probeT: 0,
  };
}
