/** Editable terrain lifecycle, chunks, water masks, raycasting, custom blocks, block icons and lighting updates. */
export let clampTerrainTint = (value) => (value < 0 ? 0 : value > 1 ? 1 : value);
