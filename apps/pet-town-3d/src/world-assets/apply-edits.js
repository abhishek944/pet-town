import { groundBasePlacement } from "./ground-base-placement.js";
import { selectAssetBaseLayout } from "./base-layout.js";
import { getWorldAssetStore } from "./storage.js";
import { placementKey } from "./placement-key.js";
import { placedAsset } from "./placed-asset.js";
import { appendAuthoredApproaches } from "./composition/approaches.js";
import { ownLegacyApproach } from "./composition/legacy-approaches.js";
import { applyAuthoredComposition } from "./composition/apply-composition.js";

/** Saved edits are applied to authored objects, never randomly distributed. */
export function applyWorldAssetEdits(village) {
  const { additions, replacements, base } = getWorldAssetStore().state;
  selectAssetBaseLayout(village, base);
  applyAuthoredComposition(village, { additions, replacements });
  const replaced = new Map(replacements.map((edit) => [edit.key, edit]));
  village.items = village.items
    .map((item) => {
      const key = placementKey(item);
      const edit = replaced.get(key);
      const replacement =
        edit && placedAsset(village.terrain, edit, key, { keepUnsupported: true });
      if (replacement) ownLegacyApproach(village, item, replacement);
      return (
        replacement ||
        (item.type === "asset"
          ? placedAsset(village.terrain, { ...item, assetId: item.opts?.assetId }, key, {
              keepUnsupported: true,
            })
          : base
            ? groundBasePlacement(village.terrain, item, { keepUnsupported: true })
            : item)
      );
    })
    .filter(Boolean);
  if (base) {
    village.plaza.y = village.terrain.h(village.plaza.x, village.plaza.z);
    village.stones = village.stones.filter((p) => !village.terrain.isWater(p.x, p.z));
  }
  for (const edit of additions) {
    const item = placedAsset(village.terrain, edit, `added:${edit.id}`, { keepUnsupported: true });
    if (item) village.items.push(item);
  }
  appendAuthoredApproaches(village, { additions, replacements });
}
