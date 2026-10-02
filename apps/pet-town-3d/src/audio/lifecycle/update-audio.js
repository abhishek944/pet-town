/** Sound dispatch, volume/mute controls, browser unlock, buffer preparation and frame updates. */
import { audioState } from "../state.js";
import { audioSmoothstep } from "../state/audio-smoothstep.js";
import { updateMusicSequencer } from "../music/update-music-sequencer.js";
import { updateAmbientAudio } from "../ambience/update-ambient-audio.js";
export function updateAudio(deltaTime, context) {
  if (
    !audioState.webAudioContext ||
    !audioState.audioRuntime.ready ||
    audioState.webAudioContext.state !== `running`
  ) {
    return;
  }
  let result = (((context.timeOfDay ?? 0.4) % 1) + 1) % 1;
  let result2 = 1 - audioSmoothstep(0.2, 0.27, result) * (1 - audioSmoothstep(0.77, 0.84, result));
  audioState.audioRuntime.night = result2;
  updateMusicSequencer(result2);
  updateAmbientAudio(deltaTime, result, result2);
}
