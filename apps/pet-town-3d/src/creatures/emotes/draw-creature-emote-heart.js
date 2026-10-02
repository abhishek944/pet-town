/** Generated expression textures, speech bubbles, sleeping symbols and pooled floating icons. */
export function drawCreatureEmoteHeart(painter, value, value2, value3) {
  painter.beginPath();
  painter.moveTo(value, value2 + value3 * 0.62);
  painter.bezierCurveTo(
    value - value3 * 1.05,
    value2 - value3 * 0.05,
    value - value3 * 0.6,
    value2 - value3 * 0.8,
    value,
    value2 - value3 * 0.32,
  );
  painter.bezierCurveTo(
    value + value3 * 0.6,
    value2 - value3 * 0.8,
    value + value3 * 1.05,
    value2 - value3 * 0.05,
    value,
    value2 + value3 * 0.62,
  );
  painter.closePath();
}
