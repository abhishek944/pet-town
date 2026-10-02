import { clampPlayerAnimationValue } from "../animation-math/clamp-player-animation-value.js";
export function playerCharacterOnLand(impact) {
  let clampPlayerAnimationValueResult = clampPlayerAnimationValue(impact * 0.018, 0.06, 0.3);
  this.sq.v -= clampPlayerAnimationValueResult * 14;
  this.earS[0].v += impact * 0.35;
  this.earS[1].v += impact * 0.35;
}
