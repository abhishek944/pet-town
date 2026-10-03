import * as THREE from "three";

// Geometry identity + attribute version catches replacements and in-place terrain/prop edits.
export function cameraMeshSource(
  mesh,
  geometry,
  matrix,
  ownerId,
  kind,
  start = 0,
  count,
  cache,
  range,
) {
  const position = geometry?.getAttribute("position");
  if (!position?.count) return null;
  const index = geometry.getIndex();
  const rangeCount = count;
  const positionVersion = range ? (range.version ?? 0) : position.version;
  count ??= position.count;
  const id = `${ownerId}:${mesh.uuid}:${start}`;
  const old = cache?.get(id);
  const sameGeometry =
    old?.geometry === geometry &&
    old.position === position &&
    old.index === index &&
    old.positionVersion === positionVersion &&
    old.indexVersion === index?.version &&
    old.count === count;
  if (sameGeometry && old.matrix.equals(matrix)) {
    return old;
  }
  matrix = matrix.clone();
  const source = {
    id,
    ownerId,
    kind,
    signature: (old?.signature ?? 0) + 1,
    mesh,
    geometry,
    position,
    index,
    matrix,
    count,
    start,
    rangeCount,
    range,
    positionVersion,
    indexVersion: index?.version,
    localBounds: sameGeometry ? old.localBounds : null,
    bounds: () => {
      source.localBounds ??= meshBounds(position, start, count);
      // Animated scenery only moves eight box corners, not every mesh vertex.
      // This conservative broadphase box leaves exact triangle queries unchanged.
      return source.localBounds.clone().applyMatrix4(matrix);
    },
    create: (rapier) => {
      const vertices = new Float32Array(count * 3);
      const point = new THREE.Vector3();
      for (let i = 0; i < count; i++) {
        point.fromBufferAttribute(position, start + i).applyMatrix4(matrix);
        vertices.set([point.x, point.y, point.z], i * 3);
      }
      const indices = index
        ? Uint32Array.from(index.array)
        : Uint32Array.from({ length: count }, (_, i) => i);
      // Each published prop range is non-indexed; terrain/tree indices cover the full mesh.
      return rapier.ColliderDesc.trimesh(
        vertices,
        indices,
        rapier.TriMeshFlags.ORIENTED |
          rapier.TriMeshFlags.MERGE_DUPLICATE_VERTICES |
          rapier.TriMeshFlags.DELETE_DEGENERATE_TRIANGLES,
      );
    },
  };
  cache?.set(id, source);
  return source;
}

function meshBounds(position, start, count) {
  const bounds = new THREE.Box3();
  const point = new THREE.Vector3();
  for (let i = start; i < start + count; i++) {
    bounds.expandByPoint(point.fromBufferAttribute(position, i));
  }
  return bounds;
}

export function cameraRegionIntersects(bounds, region) {
  return (
    bounds.max.x >= region.minX &&
    bounds.min.x <= region.maxX &&
    bounds.max.z >= region.minZ &&
    bounds.min.z <= region.maxZ
  );
}
