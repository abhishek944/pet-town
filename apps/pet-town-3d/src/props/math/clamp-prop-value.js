/** Prop interpolation, seeded random and deterministic 3D noise. */
export let clampPropValue = (value, value2 = 0, value3 = 1) =>
  Math.min(value3, Math.max(value2, value));
