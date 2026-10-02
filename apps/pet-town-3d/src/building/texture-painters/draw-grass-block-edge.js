/** Seeded procedural canvas painting helpers and block-face art. */
export function drawGrassBlockEdge(painter, size, random, color, verticalOffset = 0) {
  let result = size * verticalOffset;
  let result2 = size * 0.24;
  painter.fillStyle = color;
  painter.beginPath();
  painter.moveTo(0, result);
  painter.lineTo(size, result);
  painter.lineTo(size, result + result2 * 0.7);
  for (let result3 = 7; result3 >= 0; result3--) {
    let result4 = (result3 / 7) * size;
    let result5 = result2 * (0.6 + random() * 0.7);
    painter.quadraticCurveTo(
      result4 + (size / 7) * 0.5,
      result + result5 + result2 * 0.25,
      result4,
      result + result2 * (0.55 + random() * 0.25),
    );
  }
  painter.closePath();
  painter.fill();
  painter.fillStyle = `rgba(255,255,255,.18)`;
  painter.fillRect(0, result, size, size * 0.05);
}
