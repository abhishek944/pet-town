export function playerWorldSolidCam(x, y, z) {
  let bounds2 = this.bounds;
  return x < bounds2.minX || x >= bounds2.maxX || z < bounds2.minZ || z >= bounds2.maxZ
    ? false
    : this.solid(x, y, z);
}
