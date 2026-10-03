import { installGameStyles } from "../../core/install-game-styles.js";
import { OCEAN_PLACES } from "../layout.js";
import styles from "./assets/navigation.css?raw";

/** The journal chooses destinations; this owner only shows navigation and touch diving. */
export function createOceanNavigation(context) {
  installGameStyles("ocean-navigation-css", styles);
  const root = document.createElement("div");
  root.className = "ocean-ui";
  root.dataset.townUi = "water";
  root.hidden = true;
  root.innerHTML = `<div class="ocean-compass" hidden aria-live="off"><strong></strong><span></span></div>
    <button type="button" class="ocean-dive" hidden aria-label="Hold to dive">↓ Dive</button>`;
  const compass = root.querySelector(".ocean-compass");
  const title = compass.querySelector("strong");
  const hint = compass.querySelector("span");
  const dive = root.querySelector(".ocean-dive");
  const listeners = new AbortController();
  let target = null,
    divePointer = null,
    diveHeld = null;
  function visible() {
    return (
      !document.hidden &&
      !context.paused &&
      !context.hud?.blocking &&
      !context.hud?.hidden &&
      !context.hud?.photoMode &&
      !context.petTown?.panel?.open &&
      !context.petTown?.terminal?.inputActive &&
      !context.worldAssets?.libraryOpen
    );
  }
  function releaseDive() {
    const pointer = divePointer;
    divePointer = null;
    diveHeld?.delete("OceanDive");
    diveHeld = null;
    context.player.input.held.delete("OceanDive");
    if (pointer !== null && dive.hasPointerCapture(pointer)) dive.releasePointerCapture(pointer);
  }
  dive.addEventListener(
    "pointerdown",
    (event) => {
      if (event.button !== 0 || divePointer !== null || !visible() || !context.player.body.swimming)
        return;
      event.preventDefault();
      divePointer = event.pointerId;
      dive.setPointerCapture(event.pointerId);
      diveHeld = context.player.input.held;
      diveHeld.add("OceanDive");
    },
    { signal: listeners.signal },
  );
  for (const type of ["pointerup", "pointercancel", "lostpointercapture"]) {
    dive.addEventListener(
      type,
      (event) => {
        if (event.pointerId === divePointer) releaseDive();
      },
      { signal: listeners.signal },
    );
  }
  for (const type of [
    "pointerdown",
    "pointermove",
    "pointerup",
    "pointercancel",
    "mousedown",
    "mouseup",
    "click",
    "wheel",
  ]) {
    root.addEventListener(type, (event) => event.stopPropagation(), { signal: listeners.signal });
  }
  window.addEventListener("blur", releaseDive, { signal: listeners.signal });
  document.addEventListener(
    "visibilitychange",
    () => {
      if (document.hidden) releaseDive();
    },
    { signal: listeners.signal },
  );
  document.body.append(root);
  return {
    get headingId() {
      return target?.id ?? null;
    },
    setHeading(id) {
      const place = (context.water.exploration?.places ?? OCEAN_PLACES).find(
        (entry) => entry.id === id,
      );
      if (!place) return false;
      target = place;
      return true;
    },
    update() {
      root.style.width = `${context.viewport?.width ?? innerWidth}px`;
      const show = visible();
      root.hidden = !show;
      root.inert = !show;
      const p = context.player.position;
      const swimming = context.player.body.swimming;
      const touch = navigator.maxTouchPoints > 0;
      dive.hidden = !show || !swimming || !touch;
      if (dive.hidden && divePointer !== null) releaseDive();
      compass.hidden = !show || !target;
      if (compass.hidden) return;
      const dx = target.x - p.x,
        dz = target.z - p.z;
      const heading =
        `${dz < -5 ? "N" : dz > 5 ? "S" : ""}${dx > 5 ? "E" : dx < -5 ? "W" : ""}` || "Here";
      const depth = swimming ? Math.max(0, context.water.sample(p.x, p.z) - p.y - 1.1) : 0;
      title.textContent = `${target.name} · ${heading} · ${Math.round(Math.hypot(dx, dz))} m`;
      hint.textContent = target.transport
        ? "F to board or take the helm · WASD to steer"
        : depth > 0.3
          ? `${depth.toFixed(1)} m underwater · ${touch ? "Jump arrow" : "Space"} to rise`
          : `${touch ? "Hold Dive" : "Control"} to dive · J for destinations`;
    },
    dispose() {
      releaseDive();
      listeners.abort();
      root.remove();
    },
  };
}
