/** Creature interpolation, deterministic random generation, noise and scalar springs. */
export let wrapCreatureAngle = (value) => {
  for (; value > Math.PI;) {
    value -= Math.PI * 2;
  }
  for (; value < -Math.PI;) {
    value += Math.PI * 2;
  }
  return value;
};
