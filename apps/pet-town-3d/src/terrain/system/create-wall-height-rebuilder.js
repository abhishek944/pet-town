/** Keep the two 3×3 wall filters current without scanning the world for each edit. */
export function createWallHeightRebuilder(state) {
  let maximums;
  let minimums;
  const clamp = (value) => Math.max(0, Math.min(state.size - 1, value));
  function extremaAt(x, z) {
    let maximum = -Infinity;
    let minimum = Infinity;
    for (let dz = -1; dz <= 1; dz++) {
      for (let dx = -1; dx <= 1; dx++) {
        const height = state.columnTops[clamp(z + dz) * state.size + clamp(x + dx)];
        maximum = Math.max(maximum, height);
        minimum = Math.min(minimum, height);
      }
    }
    maximums[z * state.size + x] = maximum;
    minimums[z * state.size + x] = minimum;
  }
  function smoothAt(x, z) {
    let maximum = 0;
    let minimum = 0;
    for (let dz = -1; dz <= 1; dz++) {
      for (let dx = -1; dx <= 1; dx++) {
        const index = clamp(z + dz) * state.size + clamp(x + dx);
        maximum += maximums[index];
        minimum += minimums[index];
      }
    }
    state.wallMaximums[z * state.size + x] = maximum / 9;
    state.wallMinimums[z * state.size + x] = minimum / 9;
  }
  return (x, z) => {
    const full = !maximums || !Number.isFinite(x) || !Number.isFinite(z);
    if (!maximums) {
      maximums = new Float32Array(state.size * state.size);
      minimums = new Float32Array(state.size * state.size);
    }
    const radius = full ? state.size : 1;
    const centerX = full ? 0 : x;
    const centerZ = full ? 0 : z;
    for (let row = clamp(centerZ - radius); row <= clamp(centerZ + radius); row++) {
      for (let column = clamp(centerX - radius); column <= clamp(centerX + radius); column++) {
        extremaAt(column, row);
      }
    }
    // One changed column reaches one cell through each of the two filters.
    const smoothRadius = full ? state.size : 2;
    for (let row = clamp(centerZ - smoothRadius); row <= clamp(centerZ + smoothRadius); row++) {
      for (
        let column = clamp(centerX - smoothRadius);
        column <= clamp(centerX + smoothRadius);
        column++
      ) {
        smoothAt(column, row);
      }
    }
    state.wallHeightsDirty = false;
  };
}
