/** Start screen, loading progress and transition into play. */
import welcomeMarkup from "./assets/welcome.html?raw";
import { hudState } from "../state.js";
import { synchronizeHudInputBlocking } from "../modals/synchronize-hud-input-blocking.js";
import { createHudElement } from "../state/create-hud-element.js";
import { shouldShowTouchControls } from "../touch-controls/should-show-touch-controls.js";
import { dismissSplashScreen } from "./dismiss-splash-screen.js";
export function createSplashScreen(parent, title) {
  hudState.hudRuntime.splash = true;
  hudState.hudRuntime.orbitA = null;
  synchronizeHudInputBlocking();
  hudState.hudElements.splash = document.getElementById("boot") ?? createHudElement(welcomeMarkup);
  hudState.hudElements.splash.querySelector(".town-wordmark").textContent = title;
  if (shouldShowTouchControls()) {
    hudState.hudElements.splash.querySelector(".town-start span").textContent =
      "Tap anywhere to begin";
  }
  parent.append(hudState.hudElements.splash);
  hudState.hudRootElement.classList.add(`off`);
  let callback = (event) => {
    if (event.target?.closest?.("a, .public-town-tools")) return;
    if (hudState.hudElements.splash?.classList.contains(`ready`)) {
      removeEventListener(`pointerdown`, callback, true);
      removeEventListener(`keydown`, callback, true);
      dismissSplashScreen();
    }
  };
  addEventListener(`pointerdown`, callback, true);
  addEventListener(`keydown`, callback, true);
  let callback2 = (event) => {
    if (!hudState.hudElements.splash) {
      return removeEventListener(`pointermove`, callback2);
    }
    hudState.hudElements.splash.style.setProperty(
      `--px`,
      ((event.clientX / innerWidth) * 2 - 1).toFixed(3),
    );
    hudState.hudElements.splash.style.setProperty(
      `--py`,
      ((event.clientY / innerHeight) * 2 - 1).toFixed(3),
    );
  };
  addEventListener(`pointermove`, callback2, {
    passive: true,
  });
}
