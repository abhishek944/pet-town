/** Creature interpolation, deterministic random generation, noise and scalar springs. */
export function hashCreatureCoordinates(value, value2, value3) {
  let result = Math.sin(value * 127.1 + value2 * 311.7 + value3 * 74.7) * 43758.5453;
  return result - Math.floor(result);
}
