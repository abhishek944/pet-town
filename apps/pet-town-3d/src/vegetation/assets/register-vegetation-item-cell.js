/** Cell registration and construction of the procedural vegetation asset and field libraries. */
import { vegetationState } from "../state.js";
export function registerVegetationItemCell(cellValue, value, value2) {
  let cellOfResult = vegetationState.vegetationRuntimeState.ground.cellOf(value, value2);
  if (cellOfResult < 0) {
    return;
  }
  let values = vegetationState.vegetationRuntimeState.registry.get(cellOfResult);
  if (!values) {
    vegetationState.vegetationRuntimeState.registry.set(cellOfResult, values = []);
  }
  values.push(cellValue);
  cellValue.cell = cellOfResult;
}
