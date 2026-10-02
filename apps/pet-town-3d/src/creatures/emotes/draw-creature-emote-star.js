/** Generated expression textures, speech bubbles, sleeping symbols and pooled floating icons. */
export function drawCreatureEmoteStar(painter, value, value2, value3, value4 = 4, value5 = 0.38) {
  painter.beginPath();
  for (let index = 0; index < value4 * 2; index++) {
    let result = (index / (value4 * 2)) * Math.PI * 2 - Math.PI / 2;
    let result2 = index % 2 ? value3 * value5 : value3;
    painter.lineTo(value + Math.cos(result) * result2, value2 + Math.sin(result) * result2);
  }
  painter.closePath();
}
