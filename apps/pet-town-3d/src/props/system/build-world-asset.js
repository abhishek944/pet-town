import { appendWorldAsset } from "../collection/append.js";
import { getWorldAsset } from "../collection/catalog.js";

export function buildWorldAsset(build, placement, tag) {
  const asset = getWorldAsset(placement.opts?.assetId);
  if (!asset) return;
  const record = build.beginRecord(tag, placement, { reseat: true, foot: asset.radius });
  build.builder.begin(placement.x, placement.y, placement.z, placement.rot || 0, {
    aoH: 0.5,
    aoMin: 0.6,
  });
  const metadata = appendWorldAsset(build.builder, build.random, asset.id);
  build.registerEntry(record, asset.name, metadata.radius ?? asset.radius);
  build.registerMetadata(record, metadata);
  build.registerShade(
    record,
    placement.x,
    placement.y + 0.03,
    placement.z,
    asset.radius * 1.2,
    asset.radius * 1.2,
    0,
    0.15,
  );
}
