/** Check real edited terrain as well as the water field, including actor clearance. */
export function createMarineHabitat(context) {
  function depth(x, z) {
    const { terrain, water } = context;
    const bounds = terrain.bounds;
    if (bounds && (x < bounds.minX || x > bounds.maxX || z < bounds.minZ || z > bounds.maxZ))
      return 0;
    if (!terrain.isWater(x, z) || !water.isWater(x, z)) return 0;
    return Math.max(0, Math.min(water.depthAt(x, z), water.sample(x, z) - terrain.topY(x, z)));
  }
  function clear(x, z, minimum = 2, radius = 0) {
    if (depth(x, z) < minimum) return false;
    return (
      !radius ||
      (depth(x - radius, z) >= minimum &&
        depth(x + radius, z) >= minimum &&
        depth(x, z - radius) >= minimum &&
        depth(x, z + radius) >= minimum)
    );
  }
  return { depth, clear };
}
