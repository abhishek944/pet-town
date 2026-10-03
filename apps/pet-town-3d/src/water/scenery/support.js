/** Reseat on edited terrain, hiding models whose complete support is removed. */
export function reseatOceanScenery(context, record) {
  const { terrain, water } = context;
  const { x, z, radius, wet, clearance = 0 } = record;
  const samples = [[x, z]];
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4;
    samples.push([x + Math.cos(angle) * radius, z + Math.sin(angle) * radius]);
  }
  let low = Infinity;
  let high = -Infinity;
  let supported = true;
  for (const [sx, sz] of samples) {
    const floor = terrain.topY(sx, sz);
    const surface = water.sample(sx, sz);
    if (!Number.isFinite(floor) || floor <= 0 || !Number.isFinite(surface)) {
      supported = false;
      break;
    }
    low = Math.min(low, floor);
    high = Math.max(high, floor);
    if (wet) {
      if (
        !water.isWater(sx, sz) ||
        water.depthAt(sx, sz) < clearance + 0.1 ||
        floor + clearance > surface - 0.1
      )
        supported = false;
    } else if (floor < surface + 0.15) supported = false;
  }
  // A voxel removed from below a model must not leave it floating above a hole.
  const flat = high - low < 0.1;
  record.model.root.visible = supported && flat;
  if (record.model.root.visible) record.model.root.position.y = high + 0.025;
}
