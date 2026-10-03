import { getCameraQueryInventory } from "./get-camera-query-inventory.js";
import { cameraRegionIntersects } from "./camera-query-mesh.js";

export function synchronizeCameraQuerySources(state, focus, distance, previousPosition) {
  const started = performance.now();
  const margin = Math.max(0, distance) + 3;
  const region = {
    minX: focus.x - margin,
    maxX: focus.x + margin,
    minZ: focus.z - margin,
    maxZ: focus.z + margin,
  };
  if (previousPosition) {
    region.minX = Math.min(region.minX, previousPosition.x - 3);
    region.maxX = Math.max(region.maxX, previousPosition.x + 3);
    region.minZ = Math.min(region.minZ, previousPosition.z - 3);
    region.maxZ = Math.max(region.maxZ, previousPosition.z + 3);
  }
  const sources = getCameraQueryInventory(state);
  const oldRegion = state.preparedRegion;
  const retainRegion =
    oldRegion &&
    state.preparedFocus &&
    Math.hypot(focus.x - state.preparedFocus.x, focus.z - state.preparedFocus.z) < 8;
  if (
    state.preparedInventory === sources &&
    retainRegion &&
    region.minX >= oldRegion.minX &&
    region.maxX <= oldRegion.maxX &&
    region.minZ >= oldRegion.minZ &&
    region.maxZ <= oldRegion.maxZ
  ) {
    state.stats.prepareMs = performance.now() - started;
    state.stats.regionReuses++;
    state.stats.syncs++;
    return;
  }
  // Recovery expands coverage. Retain it through nearby frames instead of
  // deleting and rebuilding the same colliders on every contracted solve.
  if (retainRegion) {
    region.minX = Math.min(region.minX, oldRegion.minX);
    region.maxX = Math.max(region.maxX, oldRegion.maxX);
    region.minZ = Math.min(region.minZ, oldRegion.minZ);
    region.maxZ = Math.max(region.maxZ, oldRegion.maxZ);
  }
  const current = new Set();
  let changed = false;
  for (const source of sources) {
    let cache = state.bounds.get(source.id);
    if (!cache || cache.signature !== source.signature) {
      cache = { signature: source.signature, bounds: source.bounds() };
      state.bounds.set(source.id, cache);
    }
    if (!cameraRegionIntersects(cache.bounds, region)) continue;
    current.add(source.id);
    const old = state.sources.get(source.id);
    if (old?.signature === source.signature) continue;
    if (old) {
      state.world.removeCollider(old.collider, false);
      state.owners.delete(old.collider.handle);
    }
    const collider = state.world.createCollider(source.create(state.rapier));
    const owner = { ownerId: source.ownerId, kind: source.kind };
    state.owners.set(collider.handle, owner);
    state.sources.set(source.id, { collider, signature: source.signature });
    changed = true;
  }
  for (const [id, source] of state.sources) {
    if (current.has(id)) continue;
    state.world.removeCollider(source.collider, false);
    state.owners.delete(source.collider.handle);
    state.sources.delete(id);
    changed = true;
  }
  if (changed) {
    // Rapier 0.21 updates broadphase queries in step(), including standalone colliders.
    // This isolated world has no rigid bodies, so stepping cannot move game actors.
    state.world.step();
    state.revision++;
  }
  state.stats.colliders = state.sources.size;
  state.preparedInventory = sources;
  state.preparedRegion = region;
  if (!retainRegion) state.preparedFocus = { x: focus.x, z: focus.z };
  state.stats.sourceCount = sources.length;
  state.stats.prepareMs = performance.now() - started;
  state.stats.syncs++;
}
