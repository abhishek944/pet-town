/** Creature interpolation, deterministic random generation, noise and scalar springs. */
export let lerpCreatureValue = (value, value2, value3) => value + (value2 - value) * value3;
