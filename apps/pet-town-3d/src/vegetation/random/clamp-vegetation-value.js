/** Deterministic random streams, hashes, value noise and interpolation for vegetation placement and geometry. */
export let clampVegetationValue = (value, value2, value3) =>
  value < value2 ? value2 : value > value3 ? value3 : value;
