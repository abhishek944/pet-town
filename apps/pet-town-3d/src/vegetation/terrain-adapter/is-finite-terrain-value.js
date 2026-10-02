/** Terrain and block classification, height snapshots, shoreline distances, ocean detection, and ground color sampling. */
export let isFiniteTerrainValue = (value) => typeof value == `number` && Number.isFinite(value);
