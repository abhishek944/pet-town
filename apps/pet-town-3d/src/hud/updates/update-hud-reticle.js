/** Clock, weather, hotbar, targeting reticle and interaction prompts. */
import { hudState } from "../state.js";
export function updateHudReticle(deltaTime) {
  let building2 = hudState.hudContext.building;
  let aim2 = building2?.aim;
  let result = null;
  let result2 = null;
  let text = ``;
  if (
    (building2?.target &&
      aim2?.visible &&
      building2.mode !== `cursor` &&
      building2.active &&
      !hudState.hudApi.bannerActive &&
      ((result = aim2.x), (result2 = aim2.y), (text = `tgt` + (building2.canPlace ? `` : ` bad`))),
    !text &&
      !building2?.target &&
      building2?.mode === `locked` &&
      ((result = (hudState.hudContext.viewport?.width ?? innerWidth) / 2),
      (result2 = (hudState.hudContext.viewport?.height ?? innerHeight) / 2),
      (text = `idle`)),
    result != null)
  ) {
    let result4 =
      hudState.hudRuntime.retX == null ||
      Math.hypot(result - hudState.hudRuntime.retX, result2 - hudState.hudRuntime.retY) > 260
        ? 1
        : 1 - Math.exp(-deltaTime * 22);
    hudState.hudRuntime.retX =
      hudState.hudRuntime.retX == null
        ? result
        : hudState.hudRuntime.retX + (result - hudState.hudRuntime.retX) * result4;
    hudState.hudRuntime.retY =
      hudState.hudRuntime.retY == null
        ? result2
        : hudState.hudRuntime.retY + (result2 - hudState.hudRuntime.retY) * result4;
    hudState.hudElements.ret.style.transform = `translate(${hudState.hudRuntime.retX.toFixed(1)}px,${hudState.hudRuntime.retY.toFixed(1)}px)`;
  }
  let result3 = text || `hide`;
  if (result3 !== hudState.hudRuntime.retClass) {
    hudState.hudElements.ret.className = `pk-reticle ` + result3;
    hudState.hudRuntime.retClass = result3;
  }
}
