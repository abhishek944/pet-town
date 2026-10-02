/** Block face provider, face cache and isometric hotbar icon generation. */
export function applyBlockFaceGrain(painter, size, key, random) {
  let imageDataResult = painter.getImageData(0, 0, size, size);
  let data2 = imageDataResult.data;
  let result = key === `glass`;
  let result2 = Math.max(2, size * 0.06);
  for (let index = 0; index < size; index++) {
    for (let index2 = 0; index2 < size; index2++) {
      let result3 = (index * size + index2) * 4;
      if (data2[result3 + 3] === 0) {
        continue;
      }
      let result4 = 1 + (random() - 0.5) * (result ? 0.03 : 0.09);
      let result5 = Math.min(index2, index);
      let result6 = Math.min(size - 1 - index2, size - 1 - index);
      if (result5 < result2) {
        result4 *= 1 + 0.12 * (1 - result5 / result2);
      }
      if (result6 < result2) {
        result4 *= 1 - 0.16 * (1 - result6 / result2);
      }
      data2[result3] = Math.min(255, data2[result3] * result4);
      data2[result3 + 1] = Math.min(255, data2[result3 + 1] * result4);
      data2[result3 + 2] = Math.min(255, data2[result3 + 2] * result4);
    }
  }
  painter.putImageData(imageDataResult, 0, 0);
}
