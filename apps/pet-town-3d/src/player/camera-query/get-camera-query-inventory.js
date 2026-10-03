import {
  collectCameraQuerySources,
  refreshCameraQuerySource,
} from "./collect-camera-query-sources.js";

function pose(object) {
  return [
    object.position.x,
    object.position.y,
    object.position.z,
    object.quaternion.x,
    object.quaternion.y,
    object.quaternion.z,
    object.quaternion.w,
    object.scale.x,
    object.scale.y,
    object.scale.z,
    object.visible,
  ];
}

function samePose(object, before) {
  const p = object.position,
    q = object.quaternion,
    s = object.scale;
  return (
    p.x === before[0] &&
    p.y === before[1] &&
    p.z === before[2] &&
    q.x === before[3] &&
    q.y === before[4] &&
    q.z === before[5] &&
    q.w === before[6] &&
    s.x === before[7] &&
    s.y === before[8] &&
    s.z === before[9] &&
    (object.userData.veg || object.visible === before[10])
  );
}

function sameChildren(object, children) {
  return (
    object.children.length === children.length &&
    object.children.every((child, index) => child === children[index])
  );
}

function sameGeometry(source) {
  const geometry = source.currentGeometry();
  return (
    geometry === source.geometry &&
    geometry.attributes.position === source.position &&
    geometry.index === source.index &&
    (source.range ? (source.range.version ?? 0) : source.position.version) ===
      source.positionVersion &&
    source.index?.version === source.indexVersion
  );
}

function refresh(state, cache) {
  const context = state.context;
  if (!cache) return null;
  if (context.boats?.boat.model.visible !== cache.boatVisible) return null;
  const roots = [
    context.terrain?.group,
    context.props?.group,
    context.vegetation?.group,
    context.boats?.group,
  ];
  if (roots.some((root, index) => root !== cache.roots[index])) return null;
  const trees = context.vegetation?.trees ?? [];
  if (
    trees.length !== cache.trees.length ||
    trees.some(
      (tree, i) =>
        tree !== cache.trees[i] ||
        tree.parts?.[0] !== cache.treeParts[i][0] ||
        tree.parts?.[0]?.hidden !== cache.treeParts[i][1] ||
        tree.parts?.[0]?.mesh !== cache.treeParts[i][2],
    )
  )
    return null;
  for (const [object, , children, ranges] of cache.poses) {
    if (!sameChildren(object, children) || object.userData.ranges !== ranges) return null;
  }
  const moved = [];
  for (const item of cache.poses) {
    if (samePose(item[0], item[1])) continue;
    if (item[0].visible !== item[1][10]) return null;
    moved.push(item[0]);
    item[1] = pose(item[0]);
  }
  // Only a changed hierarchy branch recomputes world matrices. Rotating sails
  // no longer trigger a complete terrain/props/tree traversal and descriptor build.
  for (const object of moved) object.updateWorldMatrix(true, true);
  let sources = cache.sources;
  // Preserve inventory identity until geometry actually changes. Coverage is
  // already refreshed when the focus moves; cloning here invalidates it at rest.
  for (let i = 0; i < sources.length; i++) {
    const source = sources[i];
    const part = source.tree?.parts?.[0];
    if (source.tree && (!part || part.hidden || part.mesh !== source.mesh)) return null;
    const treePose = source.tree && state.treeMatrices.get(source.tree);
    const matrixCurrent = treePose
      ? treePose.world.equals(source.mesh.matrixWorld)
      : source.matrix.equals(source.mesh.matrixWorld);
    if (sameGeometry(source) && matrixCurrent && (!source.currentPose || source.currentPose()))
      continue;
    if (sources === cache.sources) sources = [...sources];
    const next = refreshCameraQuerySource(state, source);
    if (!next) return null;
    sources[i] = next;
    state.stats.inventoryRefreshes = (state.stats.inventoryRefreshes ?? 0) + 1;
  }
  cache.time = context.time;
  cache.sources = sources;
  state.stats.inventoryReuses++;
  return sources;
}

export function getCameraQueryInventory(state) {
  // A solve is synchronous and changes only the camera. Validate scene sources
  // once within that scope; a later caller/companion solve validates them again.
  if (
    state.solveActive &&
    state.solveInventory &&
    state.solveTerrainVersion === state.context.terrain?.version
  ) {
    state.stats.inventoryReuses++;
    return state.solveInventory;
  }
  const reused = refresh(state, state.inventory);
  if (reused) {
    if (state.solveActive) {
      state.solveInventory = reused;
      state.solveTerrainVersion = state.context.terrain?.version;
    }
    return reused;
  }
  const { context } = state;
  const sources = collectCameraQuerySources(state);
  const objects = new Set();
  for (const source of sources) {
    for (let object = source.mesh; object; object = object.parent) objects.add(object);
  }
  const roots = [
    context.terrain?.group,
    context.props?.group,
    context.vegetation?.group,
    context.boats?.group,
  ];
  for (const root of roots) if (root) objects.add(root);
  const ids = new Set(sources.map((source) => source.id));
  for (const id of state.descriptors.keys()) if (!ids.has(id)) state.descriptors.delete(id);
  for (const id of state.bounds.keys()) if (!ids.has(id)) state.bounds.delete(id);
  state.inventory = {
    time: context.time,
    boatVisible: context.boats?.boat.model.visible,
    trees: [...(context.vegetation?.trees ?? [])],
    treeParts: (context.vegetation?.trees ?? []).map((tree) => [
      tree.parts?.[0],
      tree.parts?.[0]?.hidden,
      tree.parts?.[0]?.mesh,
    ]),
    roots,
    poses: [...objects].map((object) => [
      object,
      pose(object),
      [...object.children],
      object.userData.ranges,
    ]),
    sources,
  };
  state.stats.inventoryBuilds++;
  if (state.solveActive) {
    state.solveInventory = sources;
    state.solveTerrainVersion = context.terrain?.version;
  }
  return sources;
}
