/** Deterministic random streams, hashes, value noise and interpolation for vegetation placement and geometry. */
export let vegetationHermiteBlend = (value) => value * value * (3 - 2 * value);
