/** Terrain-aware bed, coastal distance, openness and river current textures with incremental rebaking. */
export let hashWaterBedCoordinates = (value, value2) => {
  let result = Math.sin(value * 127.1 + value2 * 311.7) * 43758.5453;
  return result - Math.floor(result);
};
