import { climbingFoot, climbingGrip } from "./moonlit-pet";
import { freezePetFrame, unfreezePetFrame } from "./pet-freeze";
import { canopyLayout, canopyOffset } from "./moonlit-layout";
import { preferencesFor } from "./renderer-preferences";
import type { PositionedMotion } from "./renderer-layout";
import type { PreferencesFile } from "./preferences-types";

interface CanopyPose {
  climbing: boolean;
  supported: boolean;
  frame: number;
  assetUrl: string | null;
  paused: boolean;
  reduced: boolean;
  preferences: PreferencesFile | null;
}

/** Place a pet and its resting nook; the caller owns the shared pose clock. */
export function positionCanopyPet(
  root: HTMLElement,
  element: HTMLElement,
  motion: PositionedMotion,
  pose: CanopyPose,
): void {
  const { climbing, supported, frame } = pose;
  const layout = canopyLayout(root.clientHeight);
  const baseSize = Number.parseFloat(element.style.getPropertyValue("--citizen-size")) || 44;
  const labelWidth = element.querySelector<HTMLElement>(".project")?.offsetWidth ?? 70;
  const size = Math.min(
    baseSize * (supported ? 84 / 44 : 64 / 44),
    Math.max(8, (root.clientWidth - 72 - labelWidth) / 0.86),
  );
  const y = layout.top + 45 + layout.span - motion.x;
  const characterId = element.dataset.characterId ?? "";
  const grip = climbingGrip(characterId, frame);
  const contactY = y + (92 - size) / 2 + size * grip[1];
  const vineX = root.clientWidth - 54 + canopyOffset(contactY - layout.top);
  const x = climbing ? vineX - size * grip[0] : vineX - 134;
  element.dataset.canopyPose = supported ? "climb" : "perch";
  element.dataset.canopyBundled = String(Boolean(pose.assetUrl));
  element.style.setProperty("--canopy-size", `${size}px`);
  const fade = climbing ? Math.min(1, motion.x / 26, (layout.span - motion.x) / 26) : 1;
  element.style.setProperty("--canopy-fade", String(Math.max(0, fade)));
  const actorX = Math.max(8 + labelWidth, x);
  element.style.transform = `translate(${actorX.toFixed(2)}px, ${y.toFixed(2)}px)`;
  element.classList.toggle("direction-right", true);
  element.classList.toggle("direction-left", false);
  const label = element.querySelector<HTMLElement>(".project");
  if (label) {
    const status = element.dataset.status ?? "unknown";
    label.dataset.canopyStatus = status.charAt(0).toUpperCase() + status.slice(1);
  }
  const pet = element.querySelector<HTMLImageElement>("img.pet");
  // Theme owns its genuine pose scale/facing; extensions keep their own clip art.
  if (pet && pose.assetUrl) pet.style.setProperty("--clip-scale", "1");
  let nook = element.querySelector<SVGElement>(".canopy-nook");
  if (!climbing && !nook) {
    nook = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    nook.classList.add("canopy-nook");
    nook.setAttribute("viewBox", "0 0 94 26");
    nook.setAttribute("aria-hidden", "true");
    nook.innerHTML =
      '<path d="M0 8Q40 -5 94 10Q52 32 0 8Z" fill="#6d8d60"/><path d="M6 10L88 11" stroke="#a4b48c" stroke-width="2"/>';
    element.prepend(nook);
  }
  if (nook) {
    nook.style.display = climbing ? "none" : "";
    nook.style.top = `${supported ? 41 + size * (climbingFoot(characterId) - 0.5) : 33 + size / 2}px`;
    const nookScale = Math.min(1, size / 64);
    nook.style.width = `${152 * nookScale}px`;
    nook.style.height = `${26 * nookScale}px`;
    nook.style.left = `${nookScale === 1 ? root.clientWidth - 210 - actorX : -20 * nookScale}px`;
  }
  const frozen =
    pose.paused ||
    pose.reduced ||
    document.hidden ||
    (preferencesFor(element, pose.preferences).motion.pauseOnHover &&
      element.querySelector(".pet:hover") !== null);
  // Bundled Canopy PNGs already hold their exact shared-clock pose. Avoid a
  // canvas copy: browser image downsampling preserves the accepted soft edges.
  if (frozen && !pose.assetUrl) freezePetFrame(element);
  else unfreezePetFrame(element);
}
