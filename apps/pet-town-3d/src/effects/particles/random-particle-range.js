/** Instanced particle presets, bursts, foliage drift, fireflies, pollen and motes. */
export let randomParticleRange = (minimum, maximum) =>
  minimum + Math.random() * (maximum - minimum);
