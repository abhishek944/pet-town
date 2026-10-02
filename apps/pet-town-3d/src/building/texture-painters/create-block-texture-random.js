/** Seeded procedural canvas painting helpers and block-face art. */
export let createBlockTextureRandom = (seed) => () => {
  seed |= 0;
  seed = (seed + 1831565813) | 0;
  let imulResult = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  imulResult =
    (imulResult + Math.imul(imulResult ^ (imulResult >>> 7), 61 | imulResult)) ^ imulResult;
  return ((imulResult ^ (imulResult >>> 14)) >>> 0) / 4294967296;
};
