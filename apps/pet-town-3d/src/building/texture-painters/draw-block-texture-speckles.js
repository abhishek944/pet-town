/** Seeded procedural canvas painting helpers and block-face art. */
export function drawBlockTextureSpeckles(painter, size, random, color, count, radius = 0.025) {
  painter.fillStyle = color;
  for (let index = 0; index < count; index++) {
    painter.beginPath();
    painter.arc(random() * size, random() * size, size * radius * (0.6 + random() * 0.8), 0, 7);
    painter.fill();
  }
}
