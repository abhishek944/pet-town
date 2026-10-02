/** Generated wood, brick, shingle, stone, plaster, rock, soil, cloth, window and effect textures. */
export function drawWrappedPropTextureElement(value, value2, value3, value4, value5 = false) {
  for (let result of [-value, 0, value]) {
    for (let result2 of value5 ? [-value, 0, value] : [0]) {
      value4(value2 + result, value3 + result2);
    }
  }
}
