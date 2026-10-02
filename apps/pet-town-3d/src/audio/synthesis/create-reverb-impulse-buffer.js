/** Noise/reverb generation, audio graph and reusable oscillator/envelope instruments. */
import { audioState } from "../state.js";
export function createReverbImpulseBuffer(duration = 3.4) {
  let sampleRate2 = audioState.webAudioContext.sampleRate;
  let result = (duration * sampleRate2) | 0;
  let bufferResult = audioState.webAudioContext.createBuffer(2, result, sampleRate2);
  for (let index = 0; index < 2; index++) {
    let channelDataResult = bufferResult.getChannelData(index);
    let index2 = 0;
    for (let index3 = 0; index3 < result; index3++) {
      let result2 = index3 / result;
      let result3 = 0.2 + 0.72 * result2;
      index2 = index2 * result3 + (Math.random() * 2 - 1) * (1 - result3);
      let result4 = Math.min(1, index3 / (sampleRate2 * 0.004));
      channelDataResult[index3] = index2 * (1 - result2) ** 2.4 * (1 + 1.4 * result2) * result4;
    }
    for (let index4 = 0; index4 < 9; index4++) {
      let result5 = ((0.008 + Math.random() * 0.07) * sampleRate2) | 0;
      channelDataResult[result5] += (Math.random() * 2 - 1) * 0.35 * (1 - index4 / 9);
    }
  }
  return bufferResult;
}
