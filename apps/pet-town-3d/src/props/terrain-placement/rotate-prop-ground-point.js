/** Terrain footprint sampling, cardinal orientation and cottage/windmill entrance access. */
export let rotatePropGroundPoint = (value, value2, value3) => [
  value * Math.cos(value3) + value2 * Math.sin(value3),
  -value * Math.sin(value3) + value2 * Math.cos(value3),
];
