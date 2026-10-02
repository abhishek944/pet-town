/** Generated wood, brick, shingle, stone, plaster, rock, soil, cloth, window and effect textures. */
export function drawPropTextureSpeckles(
  painter,
  value,
  rangeValue,
  value2,
  value3,
  value4,
  value5,
) {
  for (let index = 0; index < value2; index++) {
    painter.fillStyle = value3(rangeValue);
    let rangeResult = rangeValue.range(value4, value5);
    painter.beginPath();
    painter.arc(rangeValue.next() * value, rangeValue.next() * value, rangeResult, 0, 7);
    painter.fill();
  }
}
