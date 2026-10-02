/** Pebbug beetle geometry, stone shell cells, moss, crystals, legs and flower. */
import { creaturesState } from "../../state.js";
export function prepareCreaturesSpeciesPebbug() {
  creaturesState.pebbugShellCellCenters = (() => {
    let values = [];
    for (let index = 0; index < 16; index++) {
      let result = 1 - ((index + 0.5) / 16) * 1.4;
      let result2 = Math.sqrt(Math.max(0, 1 - result * result));
      let result3 = index * 2.39996;
      values.push([
        Math.cos(result3) * result2 * 0.3,
        result * 0.235,
        Math.sin(result3) * result2 * 0.33,
      ]);
    }
    return values;
  })();
}
