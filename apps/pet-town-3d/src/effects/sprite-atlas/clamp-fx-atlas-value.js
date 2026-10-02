/** Procedural signed-distance sprite atlas for particles, emotes, glow and smoke. */
export let clampFxAtlasValue = (value, minimum = 0, maximum = 1) =>
  Math.min(maximum, Math.max(minimum, value));
