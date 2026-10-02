/** Blob shadows and generated broadleaf, pine, fringe and bark textures. */
export function drawWrappedVegetationTextureElement(value, value2, value3, value4, value5) {
  for (let result of [-value, 0, value]) {
    for (let result2 of [-value, 0, value]) {
      let result3 = value2 + result;
      let result4 = value3 + result2;
      if (!(
        result3 < -value4 ||
        result4 < -value4 ||
        result3 > value + value4 ||
        result4 > value + value4
      )) {
        value5(result3, result4);
      }
    }
  }
}
