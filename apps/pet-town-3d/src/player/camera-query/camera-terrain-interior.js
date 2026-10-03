export function cameraTerrainInterior(state, position, radius) {
  const terrain = state.context.terrain;
  // Rendered chunks are open at their boundaries: surface queries alone miss a
  // camera spawned deep underground. The voxel source identifies solid interiors.
  if (!terrain?.isSolid?.(position.x, position.y, position.z)) return null;
  const projection = state.world.projectPointAndGetFeature(
    position,
    undefined,
    undefined,
    undefined,
    undefined,
    (collider) => state.owners.get(collider.handle)?.kind === "terrain",
  );
  if (!projection) return { normal: null, depth: radius, ownerId: "terrain", kind: "terrain" };
  const delta = {
    x: projection.point.x - position.x,
    y: projection.point.y - position.y,
    z: projection.point.z - position.z,
  };
  const length = Math.hypot(delta.x, delta.y, delta.z);
  // Shore surfaces drop up to .55m within occupied voxels. Respect the mesh's
  // oriented inside result near those surfaces; use voxels only for deep interiors.
  if (!projection.isInside && length <= 0.6) return null;
  const normal =
    length > 1e-6 ? { x: delta.x / length, y: delta.y / length, z: delta.z / length } : null;
  return {
    normal,
    depth: length + radius,
    ...state.owners.get(projection.collider.handle),
  };
}
