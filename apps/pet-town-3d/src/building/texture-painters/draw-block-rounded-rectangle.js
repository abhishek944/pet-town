/** Seeded procedural canvas painting helpers and block-face art. */
export function drawBlockRoundedRectangle(painter, x, y, width, height, radius) {
  painter.beginPath();
  if (painter.roundRect) {
    painter.roundRect(x, y, width, height, radius);
  } else {
    painter.rect(x, y, width, height);
  }
}
