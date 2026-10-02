/** Blob shadows and generated broadleaf, pine, fringe and bark textures. */
export function createVegetationTextureRandom(value) {
  let result = value >>> 0;
  return () => {
    result = (result + 1831565813) >>> 0;
    let resultValue = result;
    resultValue = Math.imul(resultValue ^ (resultValue >>> 15), resultValue | 1);
    resultValue ^= resultValue + Math.imul(resultValue ^ (resultValue >>> 7), resultValue | 61);
    return ((resultValue ^ (resultValue >>> 14)) >>> 0) / 4294967296;
  };
}
