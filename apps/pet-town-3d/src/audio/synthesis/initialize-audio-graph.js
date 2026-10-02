/** Noise/reverb generation, audio graph and reusable oscillator/envelope instruments. */
import { audioState } from "../state.js";
export function initializeAudioGraph() {
  let result = window.AudioContext || window.webkitAudioContext;
  if (!result) {
    return false;
  }
  audioState.webAudioContext = new result({
    latencyHint: `interactive`,
  });
  audioState.audioNodes.master = audioState.webAudioContext.createGain();
  audioState.audioNodes.master.gain.value = 0;
  audioState.audioNodes.comp = audioState.webAudioContext.createDynamicsCompressor();
  audioState.audioNodes.comp.threshold.value = -8;
  audioState.audioNodes.comp.knee.value = 6;
  audioState.audioNodes.comp.ratio.value = 6;
  audioState.audioNodes.comp.attack.value = 0.003;
  audioState.audioNodes.comp.release.value = 0.22;
  audioState.audioNodes.mix = audioState.webAudioContext.createGain();
  audioState.audioNodes.mix.gain.value = 1.25;
  audioState.audioNodes.mix.connect(audioState.audioNodes.comp);
  audioState.audioNodes.comp.connect(audioState.audioNodes.master);
  audioState.audioNodes.master.connect(audioState.webAudioContext.destination);
  audioState.audioNodes.revIn = audioState.webAudioContext.createGain();
  let biquadFilterResult = audioState.webAudioContext.createBiquadFilter();
  biquadFilterResult.type = `highpass`;
  biquadFilterResult.frequency.value = 220;
  let biquadFilterResult2 = audioState.webAudioContext.createBiquadFilter();
  biquadFilterResult2.type = `lowpass`;
  biquadFilterResult2.frequency.value = 3800;
  biquadFilterResult2.Q.value = 0.5;
  audioState.audioNodes.conv = audioState.webAudioContext.createConvolver();
  audioState.audioNodes.revOut = audioState.webAudioContext.createGain();
  audioState.audioNodes.revOut.gain.value = 0.9;
  audioState.audioNodes.revIn.connect(biquadFilterResult);
  biquadFilterResult.connect(biquadFilterResult2);
  biquadFilterResult2.connect(audioState.audioNodes.conv);
  audioState.audioNodes.conv.connect(audioState.audioNodes.revOut);
  audioState.audioNodes.revOut.connect(audioState.audioNodes.mix);
  let callback = (value2, value3, value4 = audioState.audioNodes.mix) => {
    let gainResult = audioState.webAudioContext.createGain();
    if (((gainResult.gain.value = value2), gainResult.connect(value4), value3)) {
      let gainResult2 = audioState.webAudioContext.createGain();
      gainResult2.gain.value = value3;
      gainResult.connect(gainResult2);
      gainResult2.connect(audioState.audioNodes.revIn);
      gainResult.send = gainResult2;
    }
    return gainResult;
  };
  audioState.audioNodes.musicLP = audioState.webAudioContext.createBiquadFilter();
  audioState.audioNodes.musicLP.type = `lowpass`;
  audioState.audioNodes.musicLP.frequency.value = 7e3;
  audioState.audioNodes.musicLP.Q.value = 0.3;
  audioState.audioNodes.musicLP.connect(audioState.audioNodes.mix);
  audioState.audioNodes.music = callback(0.5, 0.55, audioState.audioNodes.musicLP);
  audioState.audioNodes.sfx = callback(0.9, 0.12);
  audioState.audioNodes.amb = callback(0.8, 0.16);
  audioState.audioNodes.ui = callback(0.7, 0.08);
  return true;
}
