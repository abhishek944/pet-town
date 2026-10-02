import { clampPlayerAnimationValue } from "../animation-math/clamp-player-animation-value.js";
export function playerCharacterPlaceShadow(x, groundY, z, playerY, onWater) {
  let shadow2 = this.shadow;
  if (!isFinite(groundY)) {
    shadow2.visible = false;
    return;
  }
  let clampPlayerAnimationValueResult = clampPlayerAnimationValue(
    1 - Math.max(0, playerY - groundY) / 7,
    0.25,
    1,
  );
  shadow2.visible = true;
  shadow2.position.set(x, groundY + 0.015, z);
  let result =
    (0.82 + 0.1 * this.w.move) *
    (0.55 + 0.45 * clampPlayerAnimationValueResult) *
    (onWater ? 1.1 : 1);
  shadow2.scale.set(result, 1, result * 0.92);
  shadow2.material.opacity =
    (onWater ? 0.18 : 0.44) * (0.3 + 0.7 * clampPlayerAnimationValueResult);
}
