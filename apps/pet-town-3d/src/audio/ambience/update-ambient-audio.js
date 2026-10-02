/** Wind, foliage, water, rain and bird/cricket/owl ambient audio. */
import { audioState } from "../state.js";
import { measureWaterAudioProximity } from "./measure-water-audio-proximity.js";
import { randomAudioRange } from "../state/random-audio-range.js";
import { clampAudioValue } from "../state/clamp-audio-value.js";
import { playBirdCall } from "./play-bird-call.js";
import { playCricketCall } from "./play-cricket-call.js";
import { playOwlCall } from "./play-owl-call.js";
export function updateAmbientAudio(deltaTime, timeOfDay, nightAmount) {
  if (
    ((audioState.ambientAudioState.acc = (audioState.ambientAudioState.acc ?? 0) + deltaTime),
    audioState.ambientAudioState.acc < 0.1)
  ) {
    return;
  }
  deltaTime = audioState.ambientAudioState.acc;
  audioState.ambientAudioState.acc = 0;
  let currentTime2 = audioState.webAudioContext.currentTime;
  let result =
    audioState.audioGameContext.player?.position ?? audioState.audioGameContext.camera?.position;
  let result2 = 1 - nightAmount;
  let result3 = Math.exp(-(((timeOfDay - 0.29) / 0.06) ** 2));
  let toLowerCaseResult = String(
    audioState.audioGameContext.weather ?? audioState.audioGameContext.sky?.weather ?? ``,
  ).toLowerCase();
  let result4 = toLowerCaseResult.includes(`rain`) || toLowerCaseResult.includes(`storm`) ? 1 : 0;
  if ((audioState.ambientAudioState.probeT -= deltaTime) <= 0) {
    audioState.ambientAudioState.probeT = 0.4;
    audioState.ambientAudioState.waterProx = measureWaterAudioProximity();
  }
  audioState.ambientAudioState.gustT -= deltaTime;
  if (audioState.ambientAudioState.gustT <= 0) {
    audioState.ambientAudioState.gustT = randomAudioRange(0.8, 2.4);
    audioState.ambientAudioState.gust = clampAudioValue(
      audioState.ambientAudioState.gust + randomAudioRange(-0.35, 0.35),
      0.1,
      1,
    );
  }
  let clampAudioValueResult = clampAudioValue(((result?.y ?? 10) - 10) / 22, 0, 1);
  let result5 =
    (0.05 + 0.1 * clampAudioValueResult + 0.06 * audioState.ambientAudioState.gust) *
    (1 + 0.3 * nightAmount);
  audioState.ambientAudioState.wind.gain.setTargetAtTime(result5, currentTime2, 0.8);
  audioState.ambientAudioState.windF.frequency.setTargetAtTime(
    300 + 450 * audioState.ambientAudioState.gust + 350 * clampAudioValueResult,
    currentTime2,
    1.2,
  );
  audioState.ambientAudioState.rustle.gain.setTargetAtTime(
    0.012 *
      audioState.ambientAudioState.gust *
      audioState.ambientAudioState.gust *
      (1 - clampAudioValueResult * 0.5),
    currentTime2,
    0.6,
  );
  let waterProx2 = audioState.ambientAudioState.waterProx;
  if (
    (audioState.ambientAudioState.brook.gain.setTargetAtTime(
      0.1 * waterProx2 * waterProx2,
      currentTime2,
      0.5,
    ),
    audioState.ambientAudioState.lap.gain.setTargetAtTime(0.22 * waterProx2, currentTime2, 0.6),
    audioState.ambientAudioState.rain.gain.setTargetAtTime(0.07 * result4, currentTime2, 1.5),
    currentTime2 > audioState.ambientAudioState.nextBird)
  ) {
    let result6 = result2 * (0.25 + 0.9 * result3) * (1 - result4 * 0.8);
    if (result6 > 0.02) {
      playBirdCall(
        currentTime2 + 0.05,
        randomAudioRange(-0.85, 0.85),
        randomAudioRange(0.035, 0.075) * (0.6 + 0.4 * result2),
      );
      if (Math.random() < 0.25 * result3) {
        playBirdCall(
          currentTime2 + randomAudioRange(0.3, 0.6),
          randomAudioRange(-0.9, 0.9),
          randomAudioRange(0.02, 0.05),
        );
      }
    }
    audioState.ambientAudioState.nextBird =
      currentTime2 + (result6 > 0.02 ? randomAudioRange(0.6, 2.2) / result6 : 1.5);
  }
  if (nightAmount > 0.15) {
    for (let result7 of audioState.ambientAudioState.crickets) {
      for (
        result7.next < currentTime2 - 0.2 &&
        (result7.next = currentTime2 + randomAudioRange(0, 0.5));
        result7.next < currentTime2 + 0.2;
      ) {
        if (Math.random() < 0.88) {
          playCricketCall(
            result7,
            result7.next,
            0.012 * result7.gain * nightAmount * (1 - result4 * 0.7),
          );
        }
        result7.next += result7.period * randomAudioRange(0.92, 1.08);
      }
    }
  }
  if (nightAmount > 0.6 && currentTime2 > audioState.ambientAudioState.nextOwl) {
    if (audioState.ambientAudioState.nextOwl) {
      playOwlCall(currentTime2 + 0.1);
    }
    audioState.ambientAudioState.nextOwl = currentTime2 + randomAudioRange(25, 60);
  }
  audioState.audioNodes.musicLP.frequency.setTargetAtTime(2600 + 5200 * result2, currentTime2, 2);
}
