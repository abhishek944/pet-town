/** Cached effect textures, instanced billboards, decals, smoke, campfire particles and pooled lights. */
export let propEffectEase = (value) => {
  let result = Math.min(1, Math.max(0, value));
  return result * result * (3 - 2 * result);
};
