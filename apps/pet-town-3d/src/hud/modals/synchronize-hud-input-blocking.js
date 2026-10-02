/** World reset confirmation, help modal and player-input blocking. */
import { hudState } from "../state.js";
export function synchronizeHudInputBlocking() {
  let result = !!(hudState.hudRuntime.help || hudState.hudRuntime.confirm);
  hudState.hudRootElement?.classList.toggle(`modal`, result);
  for (const key of ["tl", "tr", "bottom", "prompt"]) {
    const element = hudState.hudElements[key];
    if (element) element.inert = result || hudState.hudRuntime.splash;
  }
  if (result) {
    hudState.hudRuntime.touch?.releaseAll?.();
  }
  let result2 = !(result || hudState.hudRuntime.splash);
  let input2 = hudState.hudContext.player?.input;
  if (result2 !== (hudState.hudRuntime.inputOn ?? true)) {
    if (result2) {
      try {
        hudState.hudContext.player?.setInputEnabled?.(hudState.hudRuntime.prevInput ?? true);
      } catch {}
    } else {
      hudState.hudRuntime.prevInput = !input2 || input2.enabled !== false;
      try {
        hudState.hudContext.player?.setInputEnabled?.(false);
      } catch {}
    }
    hudState.hudRuntime.inputOn = result2;
  }
}
