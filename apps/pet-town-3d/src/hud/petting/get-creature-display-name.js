/** Creature proximity, petting dispatch, response messages and heart overlays. */
export let getCreatureDisplayName = (creature) =>
  creature?.name ||
  creature?.displayName ||
  creature?.species?.name ||
  creature?.species ||
  creature?.kind ||
  creature?.type ||
  `friend`;
