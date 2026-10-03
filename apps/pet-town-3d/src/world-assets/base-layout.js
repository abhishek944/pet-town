const layouts = new WeakMap();
const copy = (value) => JSON.parse(JSON.stringify(value));
const fields = { items: 512, stones: 4096, occ: 512, fronts: 512, pathSamples: 8192 };
function safeValue(value, depth = 0) {
  if (depth > 12) return false;
  if (value === null || typeof value === "boolean") return true;
  if (typeof value === "number") return Number.isFinite(value) && Math.abs(value) < 1e7;
  if (typeof value === "string") return value.length < 512;
  if (typeof value !== "object") return false;
  return Object.entries(value).every(
    ([key, item]) =>
      !["__proto__", "constructor", "prototype"].includes(key) && safeValue(item, depth + 1),
  );
}
const point = (p) => p && Number.isFinite(p.x) && Number.isFinite(p.z);
const bridgeFields = ["ax", "az", "bx", "bz", "mx", "mz", "yA", "yB", "dx", "dz", "L", "water"];
const bridge = (p) => p && bridgeFields.every((key) => Number.isFinite(p[key]));
function validPlacement(item) {
  if (!item || typeof item.type !== "string") return false;
  if (item.type === "bridge") return bridge(item);
  return (
    point(item) &&
    Number.isFinite(item.y) &&
    ["rot", "r", "found"].every((key) => item[key] === undefined || Number.isFinite(item[key])) &&
    (item.opts === undefined ||
      (item.opts && typeof item.opts === "object" && !Array.isArray(item.opts))) &&
    (item.stats === undefined ||
      (item.stats &&
        ["min", "max", "range", "wet"].every((key) => Number.isFinite(item.stats[key]))))
  );
}
export function validAssetBaseLayout(base) {
  return (
    base &&
    safeValue(base) &&
    point(base.P) &&
    Number.isFinite(base.P.y) &&
    Object.entries(fields).every(
      ([key, limit]) => Array.isArray(base[key]) && base[key].length <= limit,
    ) &&
    base.items.every(validPlacement) &&
    base.stones.every(point) &&
    base.pathSamples.every(point) &&
    base.occ.every((p) => point(p) && Number.isFinite(p.r)) &&
    base.fronts.every((p) => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite)) &&
    (base.bridge === null || bridge(base.bridge))
  );
}

/** Freeze the existing composition when the first deliberate edit is saved. */
export function selectAssetBaseLayout(village, saved) {
  const base = saved ?? {
    P: village.plaza,
    items: village.items,
    stones: village.stones,
    occ: village.occupied,
    bridge: village.bridge,
    fronts: village.entrances,
    pathSamples: village.pathSamples.flat(),
  };
  const layout = copy(base);
  layouts.set(village.context, copy(layout));
  Object.assign(village, {
    plaza: layout.P,
    items: layout.items,
    stones: layout.stones,
    occupied: layout.occ,
    bridge: layout.bridge,
    entrances: layout.fronts,
    pathSamples: [layout.pathSamples],
  });
}
export function getAssetBaseLayout(context) {
  const layout = layouts.get(context);
  return layout ? copy(layout) : undefined;
}
