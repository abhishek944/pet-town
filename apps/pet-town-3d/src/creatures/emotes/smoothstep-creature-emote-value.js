/** Generated expression textures, speech bubbles, sleeping symbols and pooled floating icons. */
export function smoothstepCreatureEmoteValue(value, value2, value3) {
  let result = Math.min(1, Math.max(0, (value3 - value) / (value2 - value)));
  return result * result * (3 - 2 * result);
}
