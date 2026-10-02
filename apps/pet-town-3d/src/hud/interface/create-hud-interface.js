import "../../pet-town/ui/theme.css";
import { createHudStatusControls } from "./create-hud-status-controls.js";
import { createHudInteractionControls } from "./create-hud-interaction-controls.js";
import { createHudOverlays } from "./create-hud-overlays.js";
/** Create HUD controls, help, reset confirmation, capture overlays and the block hotbar. */
import { hudState } from "../state.js";
import { createHudElement } from "../state/create-hud-element.js";
import { createSplashScreen } from "../splash/create-splash-screen.js";
import { installGameStyles } from "../../core/install-game-styles.js";
export function createHudInterface(context) {
  let host =
    document.getElementById(`hud`) ??
    document.body.appendChild(
      Object.assign(document.createElement(`div`), {
        id: `hud`,
      }),
    );
  hudState.hudElements.hudEl = host;
  installGameStyles("pk-hud-css", hudState.hudStyles);
  let title = hudState.hudRuntime.title;
  hudState.hudRootElement = createHudElement(`<div class="pk-root"></div>`);
  let wrapper = createHudElement(`<div class="pk"></div>`);
  wrapper.append(hudState.hudRootElement);
  host.append(wrapper);
  createHudStatusControls();
  createHudInteractionControls();
  createHudOverlays(context);
  let photoOverlay =
    createHudElement(`<div class="pk-fx"><div class="pk-vig"></div><div class="pk-frame"><i></i><i></i><i></i><i></i></div><div class="pk-flash"></div>
    <div class="pk-polaroid"><img alt=""/><div class="cap">${hudState.hudIcons.check}<b>Photo saved!</b><span></span></div></div><div class="pk-hearts"></div></div>`);
  wrapper.append(photoOverlay);
  hudState.hudElements.flash = photoOverlay.querySelector(`.pk-flash`);
  hudState.hudElements.vig = photoOverlay.querySelector(`.pk-vig`);
  hudState.hudElements.frame = photoOverlay.querySelector(`.pk-frame`);
  hudState.hudElements.pol = photoOverlay.querySelector(`.pk-polaroid`);
  hudState.hudElements.polImg = hudState.hudElements.pol.querySelector(`img`);
  hudState.hudElements.polCap = hudState.hudElements.pol.querySelector(`.cap span`);
  hudState.hudElements.hearts = photoOverlay.querySelector(`.pk-hearts`);
  let query = context.params ?? new URLSearchParams(location.search);
  let showSplash =
    query.has(`splash`) || (!navigator.webdriver && !query.has(`nosplash`) && !query.has(`cam`));
  if (showSplash) {
    createSplashScreen(wrapper, title);
  }
  let bootScreen = document.getElementById(`boot`);
  if (bootScreen) {
    if (showSplash) {
      requestAnimationFrame(() => bootScreen.remove());
    } else {
      bootScreen.style.transition = `opacity .4s`;
      bootScreen.style.opacity = `0`;
      setTimeout(() => bootScreen.remove(), 450);
    }
  }
  if (query.has(`nohud`)) {
    hudState.hudRootElement.classList.add(`nohud`);
    hudState.hudRuntime.hidden = true;
  }
  if (query.has(`help`)) {
    hudState.hudApi.toggleHelp(true);
  }
}
