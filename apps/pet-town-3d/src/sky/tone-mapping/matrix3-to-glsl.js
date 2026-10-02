/** CPU inverse tone mapping and display-to-scene color conversion. */
export let matrix3ToGlsl = (elementsValue) => {
  let elements2 = elementsValue.elements;
  let callback = (toFixedValue) => toFixedValue.toFixed(7);
  return `mat3(${callback(elements2[0])},${callback(elements2[1])},${callback(elements2[2])}, ${callback(elements2[3])},${callback(elements2[4])},${callback(elements2[5])}, ${callback(elements2[6])},${callback(elements2[7])},${callback(elements2[8])})`;
};
