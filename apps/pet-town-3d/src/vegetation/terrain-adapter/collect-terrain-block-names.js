/** Terrain and block classification, height snapshots, shoreline distances, ocean detection, and ground color sampling. */
import { isFiniteTerrainValue } from "./is-finite-terrain-value.js";
export function collectTerrainBlockNames(BLOCKValue) {
  let lookup = new Map();
  let values = [
    BLOCKValue.BLOCK,
    BLOCKValue.BLOCKS,
    BLOCKValue.Blocks,
    BLOCKValue.blocks,
    BLOCKValue.ids,
    BLOCKValue.IDS,
    BLOCKValue.B,
    BLOCKValue.blockTypes,
    BLOCKValue.types,
    BLOCKValue.palette,
  ];
  for (let result of values) {
    if (result && typeof result == `object`) {
      if (Array.isArray(result)) {
        result.forEach((nameValue, value) => {
          let result2 =
            typeof nameValue == `string`
              ? nameValue
              : nameValue && (nameValue.name ?? nameValue.key ?? nameValue.type);
          let result3 = nameValue && isFiniteTerrainValue(nameValue.id) ? nameValue.id : value;
          if (typeof result2 == `string`) {
            lookup.set(result3, result2.toLowerCase());
          }
        });
      } else {
        for (let [result4, result5] of Object.entries(result)) {
          if (isFiniteTerrainValue(result5)) {
            lookup.set(result5, result4.toLowerCase());
          } else {
            if (result5 && typeof result5 == `object` && isFiniteTerrainValue(result5.id)) {
              lookup.set(result5.id, String(result5.name ?? result4).toLowerCase());
            }
          }
        }
      }
    }
  }
  return lookup;
}
