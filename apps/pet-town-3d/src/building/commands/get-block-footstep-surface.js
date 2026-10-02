/** Animated edits, placement constraints, undo/redo and block selection. */
export let getBlockFootstepSurface = (key) =>
  ({
    grass: `grass`,
    leaves: `leaves`,
    flower: `grass`,
    mossystone: `stone`,
    dirt: `dirt`,
    clay: `dirt`,
    path: `dirt`,
    sand: `sand`,
    gravel: `gravel`,
    planks: `wood`,
    log: `wood`,
    lantern: `wood`,
    glass: `glass`,
    water: `water`,
    snow: `snow`,
  })[key] ?? `stone`;
