/** Terrain access, solid-block queries and raycast normalization with voxel-grid fallback. */
export let coerceRaycastPosition = (position) =>
  position == null
    ? null
    : Array.isArray(position)
      ? {
          x: position[0],
          y: position[1],
          z: position[2],
        }
      : typeof position == `object` && `x` in position
        ? position
        : null;
