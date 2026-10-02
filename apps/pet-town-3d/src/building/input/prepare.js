/** Input guards, cursor art and desktop/touch building event bindings. */
import { buildingState } from "../state.js";
import { createBuildingCursor } from "./create-building-cursor.js";
export function prepareBuildingInput() {
  buildingState.buildingMousePress = null;
  buildingState.buildingPointerLockChangedAt = 0;
  buildingState.buildingCursorStyles = {
    idle: createBuildingCursor(`#5a4232`, `#fffaf0`),
    aim: createBuildingCursor(`#5a4232`, `#ffe38a`),
    bad: createBuildingCursor(`#5a4232`, `#ffb2a3`),
    pet: `url("data:image/svg+xml,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20width%3D'32'%20height%3D'32'%20viewBox%3D'0%200%2024%2024'%3E%3Cpath%20d%3D'M12%2020.3S3.6%2015.2%203.6%209.3A4.4%204.4%200%200%201%2012%207.2a4.4%204.4%200%200%201%208.4%202.1c0%205.9-8.4%2011-8.4%2011z'%20fill%3D'%23ff7fa3'%20stroke%3D'%23fff'%20stroke-width%3D'2'%2F%3E%3C%2Fsvg%3E") 16 16, pointer`,
  };
}
