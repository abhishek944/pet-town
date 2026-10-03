import { propsState } from "../state.js";

/** Hide only one unsupported record's geometry and owned collision/effects. */
export function setPropRecordVisible(record, visible) {
  if ((record.visible !== false) === visible) return false;
  record.visible = visible;
  for (const group of record.statics ?? []) group.visible = visible;
  for (const fire of record.fires ?? []) {
    if (fire.mesh) fire.mesh.visible = visible;
    if (fire.light && !visible) fire.light.intensity = 0;
  }
  for (const range of propsState.propsRuntime.ranges?.get(record.tag) ?? []) {
    const position = range.mesh.geometry.attributes.position;
    const start = range.start * 3;
    const end = start + range.count * 3;
    if (visible) {
      position.array.set(range.savedPosition, start);
      delete range.savedPosition;
    } else {
      range.savedPosition = position.array.slice(start, end);
      // Degenerate triangles are invisible in both the main and shadow passes.
      for (let vertex = start; vertex < end; vertex += 3) {
        position.array[vertex] = position.array[start];
        position.array[vertex + 1] = position.array[start + 1];
        position.array[vertex + 2] = position.array[start + 2];
      }
    }
    range.hidden = !visible;
    range.version = (range.version ?? 0) + 1;
    position.addUpdateRange(start, range.count * 3);
    position.needsUpdate = true;
  }
  // Visibility changes alter the source inventory, while each range's revision
  // avoids rebuilding camera colliders for every other prop sharing this batch.
  for (const group of propsState.propsRuntime.statics) {
    if (group.userData.ranges) group.userData.ranges = new Map(group.userData.ranges);
  }
  const owners = [
    [propsState.propEntries, record.entry ? [record.entry] : []],
    [propsState.propColliders, record.cols],
    [propsState.propsRuntime.walk, record.walk],
    [propsState.propsRuntime.halos, record.lights],
    [propsState.propsRuntime.pools, record.pools],
    [propsState.propsRuntime.shade, record.shade],
    [propsState.propsRuntime.smokes, record.smokes ?? []],
    [propsState.propsRuntime.fires, record.fires ?? []],
    [propsState.propsRuntime.blades, record.blades ?? []],
  ];
  for (const [published, owned] of owners) {
    for (const item of owned) {
      const index = published.indexOf(item);
      if (visible && index < 0) published.push(item);
      else if (!visible && index >= 0) published.splice(index, 1);
    }
  }
  propsState.propsRuntime.pool.setSources(propsState.propsRuntime.halos);
  return true;
}
