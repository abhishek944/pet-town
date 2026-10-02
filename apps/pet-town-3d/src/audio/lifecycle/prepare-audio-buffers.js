/** Sound dispatch, volume/mute controls, browser unlock, buffer preparation and frame updates. */
import { audioState } from "../state.js";
import { createNoiseBuffer } from "../synthesis/create-noise-buffer.js";
import { createReverbImpulseBuffer } from "../synthesis/create-reverb-impulse-buffer.js";
import { initializeAmbientAudio } from "../ambience/initialize-ambient-audio.js";
import { updateMusicSequencer } from "../music/update-music-sequencer.js";
export async function prepareAudioBuffers() {
  let callback = () => new Promise((value) => setTimeout(value, 0));
  let result = performance.now();
  for (let result2 of [`white`, `pink`, `brown`]) {
    await callback();
    audioState.audioNodes[result2] = createNoiseBuffer(result2);
  }
  await callback();
  let reverbImpulseBufferResult = createReverbImpulseBuffer();
  await callback();
  audioState.audioNodes.conv.buffer = reverbImpulseBufferResult;
  await callback();
  initializeAmbientAudio();
  audioState.audioRuntime.ready = true;
  audioState.audioRuntime.prepMs = Math.round(performance.now() - result);
  audioState.musicSequencerState.next = audioState.webAudioContext.currentTime + 0.15;
  audioState.ambientAudioState.nextBird = audioState.webAudioContext.currentTime + 1.5;
  setInterval(() => {
    if (audioState.webAudioContext.state === `running`) {
      updateMusicSequencer(audioState.audioRuntime.night ?? 0);
    }
  }, 50);
}
