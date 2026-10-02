/** Seeded procedural canvas painting helpers and block-face art. */
export let hashBlockTextureSeed = (text) => {
  let result = 2166136261;
  for (let result2 of text) {
    result ^= result2.charCodeAt(0);
    result = Math.imul(result, 16777619);
  }
  return result >>> 0;
};
