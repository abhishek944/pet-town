/** Canonical block-name normalization. */
export let normalizeBlockName = (name) =>
  String(name ?? ``)
    .toLowerCase()
    .replace(/[^a-z]/g, ``);
