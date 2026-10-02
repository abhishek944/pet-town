/** Creature proximity, petting dispatch, response messages and heart overlays. */
export let getHudEntityPosition = (entity) =>
  entity?.position ??
  entity?.mesh?.position ??
  entity?.group?.position ??
  entity?.object?.position ??
  entity?.root?.position ??
  null;
