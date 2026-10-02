/** Noise/reverb generation, audio graph and reusable oscillator/envelope instruments. */
import { audioState } from "../state.js";
export function playLoopingNoiseBuffer(buffer, startTime, duration, destination, playbackRate = 1) {
  let bufferSourceResult = audioState.webAudioContext.createBufferSource();
  bufferSourceResult.buffer = buffer;
  bufferSourceResult.loop = true;
  bufferSourceResult.playbackRate.value = playbackRate;
  bufferSourceResult.connect(destination);
  bufferSourceResult.start(startTime, Math.random() * (buffer.duration - 0.5));
  bufferSourceResult.stop(startTime + duration);
  return bufferSourceResult;
}
