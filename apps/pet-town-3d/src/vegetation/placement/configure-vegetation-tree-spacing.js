/** Vegetation clearings, flower palettes and biome-aware world population. */
export function configureVegetationTreeSpacing(world) {
  world.treeGrid = new Map();
  world.treeGridKey = (value25, value26) => `${Math.floor(value25 / 4)},${Math.floor(value26 / 4)}`;
  world.isNearTree = (value27, value28, value29, value30 = false) => {
    let result25 = Math.floor(value27 / 4);
    let result26 = Math.floor(value28 / 4);
    for (let result27 = -2; result27 <= 2; result27++) {
      for (let result28 = -2; result28 <= 2; result28++) {
        let result29 = world.treeGrid.get(`${result25 + result27},${result26 + result28}`);
        if (result29) {
          for (let result30 of result29) {
            if (
              Math.hypot(result30.position.x - value27, result30.position.z - value28) <
              (value30 ? Math.max(value29, result30.minD) : value29 + result30.radius)
            ) {
              return true;
            }
          }
        }
      }
    }
    return false;
  };
  world.meadowTreeBudget = Math.round(world.treeBudget * 0.16);
  world.meadowTreeCount = 0;
  world.orderedTreeCandidates = [
    ...world.treeCandidates.filter((kindValue) => kindValue.kind === `meadow`),
    ...world.treeCandidates.filter((kindValue2) => kindValue2.kind !== `meadow`),
  ];
}
