/** CPU inverse tone mapping and display-to-scene color conversion. */
import { skyState } from "../state.js";
export function getSkyToneMappingMode(toneMappingValue) {
  switch (toneMappingValue.toneMapping) {
    case 0:
      return skyState.skyToneMappingModes.NONE;
    case 4:
      return skyState.skyToneMappingModes.ACES;
    case 7:
      return skyState.skyToneMappingModes.NEUTRAL;
    case 1:
      return skyState.skyToneMappingModes.LINEAR;
    default:
      return skyState.skyToneMappingModes.OTHER;
  }
}
