/** Creature interpolation, deterministic random generation, noise and scalar springs. */
export let clampCreatureValue = (value, value2, value3) =>
  value < value2 ? value2 : value > value3 ? value3 : value;
