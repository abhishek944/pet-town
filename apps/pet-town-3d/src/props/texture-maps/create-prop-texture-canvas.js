/** Generated wood, brick, shingle, stone, plaster, rock, soil, cloth, window and effect textures. */
export function createPropTextureCanvas(value, value2 = value) {
  let element = document.createElement(`canvas`);
  element.width = value;
  element.height = value2;
  return [element, element.getContext(`2d`)];
}
