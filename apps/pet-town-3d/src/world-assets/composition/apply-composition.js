import { getWorldAsset } from "../../props/collection/catalog.js";
import { placementKey } from "../placement-key.js";
import { placedAsset } from "../placed-asset.js";
import { replacements, streetLights, additions, relocations } from "./placements.js";
import { ownLegacyApproach } from "./legacy-approaches.js";
const named = new Map(replacements.map(([name, ...design]) => [name, design]));
const at = (item, x, z) => Math.abs(item.x - x) < 0.01 && Math.abs(item.z - z) < 0.01;
function designFor(item) {
  if (named.has(item.name)) return named.get(item.name);
  if (item.type === "cottage" && item.opts?.variant === "main") return ["corner-bakery", 0, -4, 0];
  if (item.type === "cottage" && item.opts?.variant === "cabin")
    return ["flower-garden-cottage", 5, 16.5, Math.PI];
  if (item.type === "lamp") {
    const light = streetLights.find(([x, z]) => at(item, x, z));
    if (light) return [light[2]];
    if (Math.abs(item.x) < 30 && Math.abs(item.z) < 30) return ["twin-lantern"];
  }
  if (item.type === "bench" && Math.abs(item.x) < 30 && Math.abs(item.z) < 30)
    return ["fern-scroll-bench"];
  return null;
}
function overlapsPersonal(placement, edits) {
  const a = getWorldAsset(placement.assetId);
  return edits.some((edit) => {
    const b = getWorldAsset(edit.assetId);
    return b && Math.hypot(edit.x - placement.x, edit.z - placement.z) < a.radius + b.radius;
  });
}
/** Overlay the same authored defaults on fresh layouts and older saved baselines. */
export function applyAuthoredComposition(village, edits) {
  const personalKeys = new Set(edits.replacements.map((edit) => edit.key));
  const personal = [...edits.additions, ...edits.replacements];
  village.items = village.items.map((item) => {
    const key = placementKey(item);
    if (personalKeys.has(key)) return item;
    const design = designFor(item);
    if (design) {
      const [assetId, x = item.x, z = item.z, rot = item.rot ?? 0] = design;
      const edit = { assetId, x, z, rot };
      if (!overlapsPersonal(edit, personal)) {
        const replacement = placedAsset(village.terrain, edit, key, { keepUnsupported: true });
        if (replacement) {
          ownLegacyApproach(village, item, replacement);
          return replacement;
        }
      }
    }
    const move = relocations.find(([type, x, z]) => item.type === type && at(item, x, z));
    const moveBlocked =
      move &&
      personal.some((edit) => {
        const asset = getWorldAsset(edit.assetId);
        return (
          asset && Math.hypot(edit.x - move[3], edit.z - move[4]) < asset.radius + (item.r ?? 1)
        );
      });
    if (!move || moveBlocked) return item;
    const stats = village.terrain.footprint(
      move[3],
      move[4],
      item.r ?? 1,
      item.r ?? 1,
      item.rot ?? 0,
      0.5,
    );
    if (stats.wet || !Number.isFinite(stats.max) || stats.range > 0.6) return item;
    return { ...item, assetKey: key, x: move[3], z: move[4], y: stats.max, stats };
  });
  for (const [id, assetId, x, z, rot] of additions) {
    const key = `authored:${id}`;
    if (village.items.some((item) => placementKey(item) === key)) continue;
    const ownEdit = edits.replacements.find((edit) => edit.key === key);
    const edit = ownEdit ?? { assetId, x, z, rot };
    if (!ownEdit && overlapsPersonal(edit, personal)) continue;
    const item = placedAsset(village.terrain, edit, key, { keepUnsupported: true });
    if (item) village.items.push(item);
  }
}
