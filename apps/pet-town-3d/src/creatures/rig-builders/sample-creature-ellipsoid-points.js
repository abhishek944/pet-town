/** Creature bones, jointed legs, jiggle metadata, mesh orientation and extrusion helpers. */
export function sampleCreatureEllipsoidPoints(value, value2, value3, value4, value5 = () => true) {
  let values = [];
  for (let index = 0; index < value; index++) {
    let result = 1 - (2 * (index + 0.5)) / value;
    let result2 = Math.sqrt(1 - result * result);
    let result3 = index * 2.399963;
    let result4 = Math.cos(result3) * result2;
    let result5 = Math.sin(result3) * result2;
    if (value5(result4, result, result5)) {
      values.push([result4 * value2, result * value3, result5 * value4, result4, result, result5]);
    }
  }
  return values;
}
