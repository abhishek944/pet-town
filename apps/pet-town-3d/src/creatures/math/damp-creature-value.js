/** Creature interpolation, deterministic random generation, noise and scalar springs. */
export let dampCreatureValue = (value, value2, value3, value4) =>
  value + (value2 - value) * (1 - Math.exp(-value3 * value4));
