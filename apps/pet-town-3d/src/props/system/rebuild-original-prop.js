import { propsState } from "../state.js";
import { groundBasePlacement } from "../../world-assets/ground-base-placement.js";
import { PropGeometryBuilder } from "../geometry-builder/prop-geometry-builder.js";
import { PropRandom } from "../math/prop-random.js";
import { configurePropRecords } from "./configure-prop-records.js";
import { configurePropColliders } from "./configure-prop-colliders.js";
import { configurePropMetadata } from "./configure-prop-metadata.js";
import { configureSmallPropBuilder } from "./configure-small-prop-builder.js";
import { buildVillageLayoutItems } from "./build-village-layout-items.js";
import { registerPropRoofSurfaces } from "./register-prop-roof-surfaces.js";
import { setPropRecordVisible } from "./set-prop-record-visible.js";
import { disposePropEmitter } from "../effects/dispose-prop-emitter.js";

/** Regenerate only this original: bridges/gardens have terrain-shaped subparts. */
export function rebuildOriginalProp(record, terrain) {
  const runtime = propsState.propsRuntime;
  const placement = groundBasePlacement(terrain, record.it);
  if (!placement) return setPropRecordVisible(record, false);
  const seed = record.buildSeed;
  if (!seed) return false;
  setPropRecordVisible(record, false);
  // The first replacement leaves its old shared triangles degenerate. Subsequent
  // replacements dispose their private geometry instead of growing static batches.
  for (const group of [...(record.statics ?? []), record.localGroup].filter(Boolean)) {
    group.traverse((object) => object.geometry?.dispose());
    group.removeFromParent();
    const index = runtime.statics.indexOf(group);
    if (index >= 0) runtime.statics.splice(index, 1);
  }
  for (const fire of record.fires ?? []) disposePropEmitter(fire);
  for (const group of runtime.statics) {
    if (group.userData.ranges?.has(record.tag)) {
      group.userData.ranges = new Map(group.userData.ranges);
      group.userData.ranges.delete(record.tag);
    }
  }
  const build = {
    context: runtime.ctx,
    terrain,
    layout: { items: [placement] },
    tag: record.tag,
    builder: new PropGeometryBuilder(seed.builder),
    random: new PropRandom(seed.random),
    placementCount: seed.placementCount,
    clearings: [],
    fireIndex: seed.fireCount,
    fireLight: record.fire?.light ?? null,
    groundY: (x, z) => terrain.h(x, z) + 0.03,
  };
  configurePropRecords(build);
  configurePropColliders(build);
  configurePropMetadata(build);
  configureSmallPropBuilder(build);
  buildVillageLayoutItems(build);
  registerPropRoofSurfaces(build);
  const group = build.builder.build(runtime.mats);
  group.name = `props_original_${record.tag}`;
  runtime.group.add(group);
  runtime.statics.push(group);
  const next = runtime.recs.get(record.tag);
  next.localGroup = group;
  runtime.ranges.set(record.tag, group.userData.ranges.get(record.tag) ?? []);
  runtime.pool.setSources(runtime.halos);
  return true;
}
