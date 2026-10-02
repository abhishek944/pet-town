/** Terrain access, solid-block queries and raycast normalization with voxel-grid fallback. */
export let resolveTerrainBlockId = (block) =>
  block == null ? 0 : typeof block == `object` ? (block.id ?? 0) : Number(block) || 0;
