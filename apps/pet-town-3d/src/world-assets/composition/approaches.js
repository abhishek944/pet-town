/** Authored door approaches and short stepping-stone links to the existing paths. */
import { getWorldAsset } from "../../props/collection/catalog.js";
const fronts = [
  ["corner-bakery", 0, -4, 0, 2.2, -0.75],
  ["flower-garden-cottage", 5, 16.5, Math.PI, 6, 12.8],
  ["gardenkeeper-cottage", 82, -23, 0, 81, -19.4],
  ["conservatory-home", 93.5, 4.5, Math.PI, 93.5, 0.9],
  ["stump-home", 17, -83, 0, 17, -79.48],
  ["stone-tower", -50, -57, 0, -50, -53.48],
  ["boat-roof-home", -61, 64, 0, -60.75, 67.35],
  ["windmill-neighbour", 71, -10, 0, 71, -6.48],
  ["glass-garden-home", 89.5, 25, Math.PI / 2, 94.05, 25],
  ["mushroom-home", -5, -58, Math.PI, -5, -61.62],
  ["woodland-library", -34, -58, Math.PI, -33.26, -61.86],
];
const links = [
  [
    "corner-bakery",
    [
      [2.2, -0.75],
      [2.2, 0.25],
      [2.2, 1.25],
      [2.8, 2.25],
    ],
  ],
  [
    "flower-garden-cottage",
    [
      [6, 12.8],
      [6, 11.8],
      [5, 11.4],
    ],
  ],
  [
    "windmill-neighbour",
    [
      [71, -6.48],
      [71, -5.2],
      [71, -3.9],
      [71, -2.6],
      [71, -1.3],
      [71, 0],
      [71, 1.3],
    ],
  ],
  [
    "glass-garden-home",
    [
      [94.05, 25],
      [94.05, 23.8],
      [94.05, 22.6],
    ],
  ],
  [
    "mushroom-home",
    [
      [-5, -61.62],
      [-4.3, -62.3],
    ],
  ],
  [
    "woodland-library",
    [
      [-33.26, -61.86],
      [-34.2, -62.4],
    ],
  ],
];
export function appendAuthoredApproaches(village, edits) {
  const occupied = (x, z, assetKey) =>
    [...edits.additions, ...edits.replacements].some((edit) => {
      if (edit.key === assetKey || (edit.id && `added:${edit.id}` === assetKey)) return false;
      const asset = getWorldAsset(edit.assetId);
      return asset && Math.hypot(x - edit.x, z - edit.z) < asset.radius + 0.5;
    });
  const present = new Map();
  for (const [id, px, pz, rot, x, z] of fronts) {
    const item = village.items.find(
      (item) =>
        item.type === "asset" &&
        item.opts.assetId === id &&
        Math.abs(item.x - px) < 0.01 &&
        Math.abs(item.z - pz) < 0.01 &&
        Math.abs((item.rot ?? 0) - rot) < 0.01,
    );
    if (!item) continue;
    present.set(id, item.assetKey);
    if (!village.terrain.isWater(x, z))
      village.pathSamples.push([{ x, z, assetKey: item.assetKey }]);
  }
  for (const [assetId, points] of links) {
    const assetKey = present.get(assetId);
    if (!assetKey) continue;
    for (const [x, z] of points) {
      if (village.terrain.isWater(x, z) || occupied(x, z, assetKey)) continue;
      if (!village.stones.some((p) => Math.abs(p.x - x) < 0.01 && Math.abs(p.z - z) < 0.01))
        village.stones.push({ x, z });
      village.pathSamples.push([{ x, z, assetKey }]);
    }
  }
}
