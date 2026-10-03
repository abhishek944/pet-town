import { cameraTerrainInterior } from "./camera-terrain-interior.js";

const rotation = { x: 0, y: 0, z: 0, w: 1 };

export function cameraQueryOverlaps(state, position, radius) {
  state.stats.overlaps++;
  if (
    state.overlapTime !== state.context.time ||
    state.overlapRevision !== state.revision ||
    state.overlapTerrainVersion !== state.context.terrain?.version
  ) {
    state.overlapCache.clear();
    state.overlapTime = state.context.time;
    state.overlapRevision = state.revision;
    state.overlapTerrainVersion = state.context.terrain?.version;
  }
  const key = `${position.x},${position.y},${position.z},${radius}`;
  if (state.overlapCache.has(key)) {
    state.stats.overlapReuses++;
    return state.overlapCache.get(key);
  }
  const ball = new state.rapier.Ball(radius);
  const results = new Map();
  state.world.intersectionsWithShape(position, rotation, ball, (collider) => {
    const contact = collider.contactShape(ball, position, rotation, 0);
    if (contact && contact.distance < -1e-5) {
      results.set(collider.handle, {
        normal: contact.normal1,
        depth: -contact.distance,
        ...state.owners.get(collider.handle),
      });
    }
    return true;
  });
  // A sphere entirely contained within a closed trunk/prop has no intersecting
  // triangles. Point containment plus boundary projection still reports escape.
  state.world.intersectionsWithPoint(
    position,
    (collider) => {
      const owner = state.owners.get(collider.handle);
      if (owner?.kind === "terrain") return true;
      const projection = collider.projectPoint(position, false);
      if (!projection?.isInside) return true;
      const delta = {
        x: projection.point.x - position.x,
        y: projection.point.y - position.y,
        z: projection.point.z - position.z,
      };
      const length = Math.hypot(delta.x, delta.y, delta.z);
      results.set(collider.handle, {
        normal:
          length > 1e-6 ? { x: delta.x / length, y: delta.y / length, z: delta.z / length } : null,
        depth: length + radius,
        ...owner,
      });
      return true;
    },
    undefined,
    undefined,
    undefined,
    undefined,
    (collider) => state.owners.get(collider.handle)?.kind !== "terrain",
  );
  const interior = cameraTerrainInterior(state, position, radius);
  if (interior) results.set("terrain-interior", interior);
  const hits = [...results.values()];
  state.overlapCache.set(key, hits);
  return hits;
}

function path(start, end) {
  const x = end.x - start.x;
  const y = end.y - start.y;
  const z = end.z - start.z;
  const length = Math.hypot(x, y, z);
  return { length, direction: { x: x / length, y: y / length, z: z / length } };
}

export function cameraQuerySweep(state, start, end, radius) {
  state.stats.sweeps++;
  const overlaps = cameraQueryOverlaps(state, start, radius);
  if (overlaps.length) {
    const overlap = overlaps.reduce((a, b) => (a.depth > b.depth ? a : b));
    return { ...overlap, distance: 0, initialOverlap: true };
  }
  const { length, direction } = path(start, end);
  if (length < 1e-6) return null;
  const hit = state.world.castShape(
    start,
    rotation,
    direction,
    new state.rapier.Ball(radius),
    0,
    length,
    true,
  );
  if (!hit) return null;
  return {
    distance: hit.time_of_impact,
    normal: hit.normal1,
    initialOverlap: hit.time_of_impact <= 1e-6,
    ...state.owners.get(hit.collider.handle),
  };
}

export function cameraQueryRaycast(state, start, end, filterMode) {
  state.stats.rays++;
  const { length, direction } = path(start, end);
  if (length < 1e-6) return null;
  const hit = state.world.castRayAndGetNormal(
    new state.rapier.Ray(start, direction),
    length,
    true,
    undefined,
    undefined,
    undefined,
    undefined,
    filterMode === true
      ? (collider) => state.owners.get(collider.handle)?.kind === "vegetation"
      : filterMode === "opaque"
        ? (collider) => state.owners.get(collider.handle)?.kind !== "vegetation"
        : undefined,
  );
  return hit
    ? { distance: hit.timeOfImpact, normal: hit.normal, ...state.owners.get(hit.collider.handle) }
    : null;
}
