import { vegetationState } from "../state.js";
import { removeVegetationTree } from "./remove-vegetation-tree.js";
import { hideVegetationItem } from "./hide-vegetation-item.js";
import { createVegetationClearingPredicate } from "../placement/create-vegetation-clearing-predicate.js";
import { collectVegetationClearings } from "../placement/collect-vegetation-clearings.js";

function retainItem(item) {
  const runtime = vegetationState.vegetationRuntimeState;
  const proxies = [];
  for (const [kind, mesh] of [
    ["shadow", runtime.proxyShadow],
    ["refl", runtime.proxyRefl],
  ]) {
    const range = item.proxyRanges?.[kind];
    if (!mesh || !range) continue;
    const [start, end] = range;
    proxies.push({
      mesh,
      start,
      end,
      positions: mesh.geometry.attributes.position.array.slice(start * 3, end * 3),
    });
  }
  return { item, proxies, ranges: item.proxyRanges };
}

/** Keep original local instances available for undo, rather than rebuilding every forest. */
export function retainTerrainVegetation(item, cell, support) {
  const runtime = vegetationState.vegetationRuntimeState;
  if (item.field === runtime.dyn) {
    hideVegetationItem(item);
    return;
  }
  const cells = (runtime.terrainHiddenCells ??= new Map());
  let retained = cells.get(cell);
  if (!retained) cells.set(cell, (retained = { support, records: new Map() }));
  const owner = item.owner?.cell === cell ? item.owner : null;
  const key = owner ?? item;
  if (!retained.records.has(key)) {
    const parts = owner ? owner.parts.filter((part) => !part.hidden) : [item];
    retained.records.set(key, {
      owner,
      items: parts.map(retainItem),
      colliders: runtime.colliders.filter((collider) =>
        owner ? collider === owner || collider.owner === owner : collider.item === item,
      ),
    });
  }
  if (owner) removeVegetationTree(owner, true);
  else hideVegetationItem(item);
}

export function restoreTerrainVegetation(cell) {
  const runtime = vegetationState.vegetationRuntimeState;
  const retained = runtime.terrainHiddenCells?.get(cell);
  if (!retained) return false;
  const ground = runtime.ground;
  const before = retained.support;
  if (
    Math.abs(ground.h[cell] - before.h) > 0.01 ||
    ground.top[cell] !== before.top ||
    Number.isNaN(ground.water[cell]) !== Number.isNaN(before.water)
  )
    return false;
  const cleared = createVegetationClearingPredicate(collectVegetationClearings());
  let restored = false;
  for (const [key, record] of retained.records) {
    const first = record.items[0]?.item;
    if (!first || cleared(first.x, first.z, record.owner ? "tree" : "small")) continue;
    for (const saved of record.items) {
      saved.item.hidden = false;
      saved.item.field.update(saved.item);
      for (const proxy of saved.proxies) {
        const position = proxy.mesh.geometry.attributes.position;
        position.array.set(proxy.positions, proxy.start * 3);
        position.addUpdateRange(proxy.start * 3, (proxy.end - proxy.start) * 3);
        position.needsUpdate = true;
      }
      saved.item.proxyRanges = saved.ranges;
    }
    if (record.owner && !runtime.trees.includes(record.owner)) runtime.trees.push(record.owner);
    for (const collider of record.colliders) {
      if (!runtime.colliders.includes(collider)) runtime.colliders.push(collider);
    }
    retained.records.delete(key);
    restored = true;
  }
  if (!retained.records.size) runtime.terrainHiddenCells.delete(cell);
  if (restored) runtime.canopies = null;
  return restored;
}
