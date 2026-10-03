import { DISPLAY_SHELF } from "./places.js";

/** Publish one owned standard actor collider without replacing shared collections. */
export function createShelfCollider(context) {
  const record = { ...DISPLAY_SHELF, w: 3.2, d: 1.1, h: 1.18, top: true, y0: 0 };
  let installed;
  function remove() {
    if (Array.isArray(installed)) {
      const index = installed.indexOf(record);
      if (index >= 0) installed.splice(index, 1);
    } else installed?.delete(record);
    installed = undefined;
  }
  return {
    update(height) {
      if (height === null) return remove();
      record.y0 = height;
      if (context.colliders == null) context.colliders = [];
      const collection = context.colliders;
      if (
        !Array.isArray(collection) &&
        !(collection instanceof Set) &&
        !(collection instanceof Map)
      )
        throw new TypeError("Shellhaven needs an array, Set or Map of shared colliders.");
      if (installed !== collection) remove();
      installed = collection;
      if (Array.isArray(collection)) {
        if (!collection.includes(record)) collection.push(record);
      } else if (collection instanceof Map) collection.set(record, record);
      else collection.add(record);
    },
    dispose: remove,
  };
}
