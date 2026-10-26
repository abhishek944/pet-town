import type { FlowSample } from "./flow-runtime";
import { activityPresentationFor } from "./activity-pet";
import type { CitizenState } from "./village";
import { syncCitizenVisibility } from "./renderer-visibility";
import { refreshCitizenLabelPosition as refreshSpriteBounds } from "./renderer-image-bounds";
import { applyPetImage, disposePetImage } from "./renderer-image";
export { ASSET_READY_TIMEOUT_MS } from "./renderer-image";
export { setPreferenceHidden } from "./renderer-visibility";
export function refreshCitizenLabelPosition(element: HTMLElement): void {
  refreshSpriteBounds(element);
  if (element.dataset.activityTheme !== "rollercoaster" || element.hidden) return;
  const stack = element.querySelector<HTMLElement>(".pet-stack");
  const label = element.querySelector<HTMLElement>(".project");
  if (!stack || !label) return;
  // Cache layout-only distance from the citizen bottom, unaffected by label transforms.
  element.style.setProperty("--coaster-label-rise",
    `${element.offsetHeight - stack.offsetTop - label.offsetTop}px`);
}

export interface HitRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const CITIZEN_TRACK_WIDTH = 104;
export const SUSPENSION_GAP_MS = 250;

export function distanceWhileAssetPending(sample: FlowSample, elapsedMs: number): number {
  if (!sample.moving || !Number.isFinite(sample.speedPxPerSecond)) return 0;
  const duration = Number.isFinite(elapsedMs) ? Math.max(0, elapsedMs) : 0;
  return sample.speedPxPerSecond * (duration / 1_000);
}

export function motionSeed(id: string): number {
  let value = 2166136261;
  for (let index = 0; index < id.length; index += 1) {
    value = Math.imul(value ^ id.charCodeAt(index), 16777619) >>> 0;
  }
  return value;
}

export function createCitizenElement(): HTMLElement {
  const wrapper = document.createElement("section");
  wrapper.className = "citizen";

  const project = document.createElement("span");
  project.className = "project";

  const stack = document.createElement("span");
  stack.className = "pet-stack";

  const pet = document.createElement("img");
  pet.className = "pet";
  pet.decoding = "sync";
  pet.alt = "";
  pet.draggable = false;
  pet.hidden = true;

  const shadow = document.createElement("span");
  shadow.className = "shadow";
  shadow.setAttribute("aria-hidden", "true");

  stack.append(project, pet);
  wrapper.append(stack, shadow);
  return wrapper;
}

export function updateCitizenElement(element: HTMLElement, citizen: CitizenState): void {
  element.className = `citizen${citizen.retiring ? " retiring" : ""}`;
  element.dataset.agentId = citizen.id;
  element.dataset.characterId = citizen.sprite;
  element.dataset.agentSource = citizen.source;
  element.dataset.status = citizen.status;
  element.dataset.doneSinceMs = citizen.doneSinceMs === null ? "" : String(citizen.doneSinceMs);
  const announced = citizen.source === "orchestrator"
    ? (citizen.status === "speaking" ? "Speaking" : citizen.status === "listening" ? "Listening" : "Walking") : citizen.status;
  element.setAttribute("aria-label", `${citizen.label}, ${announced}`);
  element.title = citizen.remoteMachine
    ? `Select pane on ${citizen.remoteMachine}. Open Herdr and select that machine to view it.`
    : "Open agent";

  const project = element.querySelector<HTMLElement>(".project");
  if (project && project.textContent !== citizen.label) project.textContent = citizen.label;
}

function applyPetPresentation(pet: HTMLImageElement, sample: FlowSample, clip = sample.clip, dedicated = false): void {
  const className = [
    "pet",
    clip?.mirror ? "clip-mirror-safe" : "clip-fixed-facing",
    clip?.sourceFacing === "left" ? "clip-source-left" : "clip-source-right",
    !dedicated && sample.moving ? "flow-moving" : "flow-stationary",
    sample.failed ? "flow-failed" : "",
  ].filter(Boolean).join(" ");
  if (pet.className !== className) pet.className = className;
  const scale = String(clip?.scale ?? 1);
  if (pet.style.getPropertyValue("--clip-scale") !== scale) {
    pet.style.setProperty("--clip-scale", scale);
  }
}

export function applyFlowSample(
  element: HTMLElement,
  sample: FlowSample,
  fallbackAssetUrl = "",
  onGeometryChange: () => void = () => {},
  themedAssetUrl: string | null = null,
): boolean {
  const pet = element.querySelector<HTMLImageElement>("img.pet");
  if (!pet) return true;
  const oceanAsset = themedAssetUrl ? "true" : "false";
  if (element.dataset.oceanAsset !== oceanAsset) element.dataset.oceanAsset = oceanAsset;

  element.dataset.flowVisible = String(sample.visible);
  if (!sample.visible || element.dataset.preferenceHidden === "true") {
    disposePetImage(element);
    syncCitizenVisibility(element, pet, onGeometryChange);
    return true;
  }

  const clip = sample.clip;
  const presentation = activityPresentationFor(element, themedAssetUrl);
  const presentationClip = presentation ?? clip;
  const dedicated = element.parentElement?.dataset.stripTheme === "canopy" && Boolean(themedAssetUrl)
    || presentation?.name === `activity:${element.parentElement?.dataset.stripTheme}:${element.dataset.status}`;
  const assetUrl = themedAssetUrl ?? (sample.held ? clip?.holdAssetUrl : clip?.assetUrl)
    ?? clip?.assetUrl
    ?? fallbackAssetUrl;
  const ready = applyPetImage(
    element, assetUrl, dedicated ? null : sample.clipEpoch, dedicated ? false : sample.held,
    () => {
      applyPetPresentation(pet, sample, presentationClip, dedicated);
      // Reveal before measuring padding; hidden image boxes otherwise report zero height.
      syncCitizenVisibility(element, pet, () => {});
      refreshCitizenLabelPosition(element);
      onGeometryChange();
    },
  );
  if (pet.dataset.assetReadyKey === pet.dataset.assetKey) {
    applyPetPresentation(pet, sample, presentationClip, dedicated);
  }
  syncCitizenVisibility(element, pet, onGeometryChange);
  return ready;
}

export function regionFor(element: Element): HitRegion | null {
  const bounds = element.getBoundingClientRect();
  if (bounds.width <= 0 || bounds.height <= 0) return null;
  return { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height };
}
