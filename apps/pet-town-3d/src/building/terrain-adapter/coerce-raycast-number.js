/** Terrain access, solid-block queries and raycast normalization with voxel-grid fallback. */
export let coerceRaycastNumber = (value) => (value == null ? NaN : Number(value));
