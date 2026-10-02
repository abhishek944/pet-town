/** Terrain footprint sampling, cardinal orientation and cottage/windmill entrance access. */
export let snapPropCardinalRotation = (value) => Math.round(value / (Math.PI / 2)) * (Math.PI / 2);
