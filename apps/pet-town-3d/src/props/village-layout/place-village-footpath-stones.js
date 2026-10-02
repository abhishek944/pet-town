/** Deterministic settlement layout, buildings, connecting footpaths, lamps, props and bridge site selection. */
export function placeVillageFootpathStones(village) {
  village.pathSampleCount = village.pathSamples.reduce(
    (value33, values10) => value33 + values10.length,
    0,
  );
  village.stoneDensity = Math.min(1, 35 / Math.max(1, village.pathSampleCount));
  for (let values11 of village.pathSamples) {
    let index5 = 0;
    for (let result74 of values11) {
      index5 += village.stoneDensity;
      if (index5 >= 1 || values11.length <= 3) {
        --index5;
        village.stones.push(result74);
      }
    }
  }
  for (let position12 of village.stairs) {
    village.items.push({
      type: `pathSteps`,
      x: position12.x,
      z: position12.z,
      rot: position12.rot,
      r: 0.8,
      y: position12.y,
      opts: {
        rise: position12.rise,
      },
    });
    village.occupied.push({
      x: position12.x,
      z: position12.z,
      r: 0.8,
      type: `stairs`,
    });
  }
}
