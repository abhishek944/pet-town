import { getWorldAsset } from "../props/collection/catalog.js";
/** Validate support at the authored coordinates; never find an alternate site. */
export function placedAsset(terrain, edit, key, { keepUnsupported = false } = {}) {
  const asset = getWorldAsset(edit.assetId);
  if (!asset || !terrain.inBounds(edit.x, edit.z, Math.max(asset.hw, asset.hd) + 1)) return null;
  const stats = terrain.footprint(edit.x, edit.z, asset.hw, asset.hd, edit.rot, 0.5);
  if (!Number.isFinite(stats.max)) return null;
  const supportValid = !stats.wet && stats.range <= 0.6;
  if (!supportValid && !keepUnsupported) return null;
  return {
    type: "asset",
    assetKey: key,
    x: edit.x,
    y: stats.max,
    z: edit.z,
    rot: edit.rot,
    name: asset.name,
    r: asset.radius,
    opts: { assetId: asset.id },
    stats,
    supportValid,
  };
}
