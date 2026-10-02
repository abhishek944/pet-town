/** Noise/reverb generation, audio graph and reusable oscillator/envelope instruments. */
import { audioState } from "../state.js";
export function createNoiseBuffer(kind, duration = 4) {
  let sampleRate2 = audioState.webAudioContext.sampleRate;
  let result = (duration * sampleRate2) | 0;
  let result2 = (sampleRate2 * 0.08) | 0;
  let floatBuffer = new Float32Array(result + result2);
  let index = 0;
  let index2 = 0;
  let index3 = 0;
  let index4 = 0;
  let index5 = 0;
  let index6 = 0;
  let index7 = 0;
  let index8 = 0;
  for (let index9 = 0; index9 < result + result2; index9++) {
    let result3 = Math.random() * 2 - 1;
    if (kind === `white`) {
      floatBuffer[index9] = result3 * 0.5;
    } else {
      if (kind === `pink`) {
        index = 0.99886 * index + result3 * 0.0555179;
        index2 = 0.99332 * index2 + result3 * 0.0750759;
        index3 = 0.969 * index3 + result3 * 0.153852;
        index4 = 0.8665 * index4 + result3 * 0.3104856;
        index5 = 0.55 * index5 + result3 * 0.5329522;
        index6 = -0.7616 * index6 - result3 * 0.016898;
        floatBuffer[index9] =
          (index + index2 + index3 + index4 + index5 + index6 + index7 + result3 * 0.5362) * 0.11;
        index7 = result3 * 0.115926;
      } else {
        index8 = (index8 + 0.02 * result3) / 1.02;
        floatBuffer[index9] = index8 * 3.2;
      }
    }
  }
  let bufferResult = audioState.webAudioContext.createBuffer(1, result, sampleRate2);
  let channelDataResult = bufferResult.getChannelData(0);
  for (let index10 = 0; index10 < result; index10++) {
    channelDataResult[index10] =
      index10 < result2
        ? floatBuffer[index10] * (index10 / result2) +
          floatBuffer[result + index10] * (1 - index10 / result2)
        : floatBuffer[index10];
  }
  return bufferResult;
}
