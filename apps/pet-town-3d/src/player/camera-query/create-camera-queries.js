import RAPIER from "@dimforge/rapier3d-compat";
import { synchronizeCameraQuerySources } from "./synchronize-camera-query-sources.js";
import {
  cameraQueryOverlaps,
  cameraQueryRaycast,
  cameraQuerySweep,
} from "./camera-query-operations.js";

let initialized;

export async function initializeCameraQueries(context) {
  initialized ??= RAPIER.init();
  await initialized;
  context.cameraQueries?.dispose();
  const identities = new WeakMap();
  let nextIdentity = 0;
  const state = {
    context,
    rapier: RAPIER,
    world: new RAPIER.World({ x: 0, y: 0, z: 0 }),
    sources: new Map(),
    owners: new Map(),
    bounds: new Map(),
    descriptors: new Map(),
    treeMatrices: new WeakMap(),
    overlapCache: new Map(),
    revision: 0,
    stats: {
      colliders: 0,
      sourceCount: 0,
      syncs: 0,
      prepareMs: 0,
      prepareTotalMs: 0,
      sweeps: 0,
      overlaps: 0,
      overlapReuses: 0,
      rays: 0,
      inventoryBuilds: 0,
      inventoryReuses: 0,
      regionReuses: 0,
    },
    identity(source) {
      if (!identities.has(source)) identities.set(source, ++nextIdentity);
      return identities.get(source);
    },
  };
  let disposed = false;
  const requireActive = () => {
    if (disposed) throw new Error("Camera queries have been disposed");
  };
  const queries = {
    beginSolve() {
      requireActive();
      state.solveActive = true;
      state.solveInventory = null;
    },
    endSolve() {
      state.solveActive = false;
      state.solveInventory = null;
    },
    prepare(focus, distance, previousPosition) {
      requireActive();
      const started = performance.now();
      synchronizeCameraQuerySources(state, focus, distance, previousPosition);
      state.stats.prepareTotalMs += performance.now() - started;
    },
    sweep(start, end, radius) {
      requireActive();
      return cameraQuerySweep(state, start, end, radius);
    },
    overlaps(position, radius) {
      requireActive();
      return cameraQueryOverlaps(state, position, radius);
    },
    raycast(start, end, filterMode = false) {
      requireActive();
      return cameraQueryRaycast(state, start, end, filterMode);
    },
    get revision() {
      return state.revision;
    },
    get stats() {
      return { ...state.stats };
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      state.world.free();
      state.sources.clear();
      state.owners.clear();
      state.bounds.clear();
      state.descriptors.clear();
      state.inventory = null;
      state.overlapCache.clear();
      state.preparedInventory = null;
    },
  };
  context.cameraQueries = queries;
  return queries;
}
