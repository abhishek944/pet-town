/** Start screen, loading progress and transition into play. */
import { hudState } from "../state.js";
import { synchronizeHudInputBlocking } from "../modals/synchronize-hud-input-blocking.js";
import { playHudSound } from "../state/play-hud-sound.js";
import { showHudToast } from "../notifications/show-hud-toast.js";
export function dismissSplashScreen() {
  if (!hudState.hudRuntime.splash) {
    return;
  }
  hudState.hudRuntime.splash = false;
  hudState.hudRuntime.splashOffAt = performance.now();
  hudState.hudElements.splash.classList.add(`out`);
  hudState.hudRootElement.classList.remove(`off`);
  synchronizeHudInputBlocking();
  let enabled = false;
  if (typeof hudState.hudContext.player?.introDolly == `function`) {
    try {
      hudState.hudContext.player.introDolly({
        from: hudState.hudContext.camera.position.clone(),
      });
      enabled = true;
    } catch {}
  }
  if (!enabled && hudState.hudRuntime.orbitA != null) {
    hudState.hudRuntime.blend = {
      t: 0,
      a: hudState.hudRuntime.orbitA,
      r: hudState.splashCameraSettings.r,
      h: 1.2 + hudState.splashCameraSettings.h,
    };
  }
  hudState.hudRuntime.hotbarUntil = performance.now() + 5e3;
  setTimeout(() => playHudSound(`start`), 90);
  setTimeout(() => {
    hudState.hudElements.splash?.remove();
    hudState.hudElements.splash = null;
  }, 1200);
  setTimeout(() => {
    hudState.hudApi.banner(
      hudState.hudContext.areaName ?? `Sunny Meadow`,
      `Day ${hudState.hudContext.day ?? hudState.hudContext.sky?.day ?? hudState.hudRuntime.day}`,
    );
  }, 500);
  setTimeout(
    () =>
      showHudToast(`Tip: press H any time to see the controls`, {
        icon: `leaf`,
        color: `#d7f5c4`,
      }),
    5200,
  );
}
