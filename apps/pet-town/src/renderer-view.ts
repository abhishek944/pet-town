import type { FlowSample } from "./flow-runtime";
import type { CitizenState } from "./village";
import { normalizeHerdrState } from "./flow-utils";
import { syncCitizenVisibility } from "./renderer-visibility";
import { refreshCitizenLabelPosition, visibleBoundsRatios } from "./renderer-image-bounds";

export const STATUS_LABELS: Readonly<Record<string, string>> = {
  working: "Working",
  blocked: "Needs reply",
  done: "Done",
  idle: "Ready",
  unknown: "Unknown",
  listening: "Listening",
  speaking: "Speaking",
};
export { setPreferenceHidden } from "./renderer-visibility";
export { refreshCitizenLabelPosition } from "./renderer-image-bounds";

export interface HitRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const ASSET_READY_TIMEOUT_MS = 1_500;
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
  const name = document.createElement("span");
  name.className = "project-name";
  const status = document.createElement("span");
  status.className = "project-status";
  project.append(name, status);

  const stack = document.createElement("span");
  stack.className = "pet-stack";

  const pet = document.createElement("img");
  pet.className = "pet";
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
  element.className = "citizen" + (citizen.retiring ? " retiring" : "");
  element.dataset.agentId = citizen.id;
  element.dataset.characterId = citizen.sprite;
  element.dataset.agentSource = citizen.source;
  const normalizedStatus = normalizeHerdrState(citizen.status);
  const badgeStatus =
    citizen.source === "orchestrator" &&
    (citizen.status === "listening" || citizen.status === "speaking")
      ? citizen.status
      : normalizedStatus;
  const statusLabel = STATUS_LABELS[badgeStatus] ?? STATUS_LABELS.unknown;
  element.dataset.status = badgeStatus;
  element.dataset.doneSinceMs = citizen.doneSinceMs === null ? "" : String(citizen.doneSinceMs);
  const description = citizen.label + ", " + statusLabel + ". Click to focus this agent.";
  element.setAttribute("aria-label", description);

  const project = element.querySelector<HTMLElement>(".project");
  if (project) project.title = description;
  const name = element.querySelector<HTMLElement>(".project-name");
  if (name && name.textContent !== citizen.label) name.textContent = citizen.label;
  const status = element.querySelector<HTMLElement>(".project-status");
  if (status && status.textContent !== statusLabel) status.textContent = statusLabel;
}

function applyPetPresentation(pet: HTMLImageElement, sample: FlowSample): void {
  const clip = sample.clip;
  const className = [
    "pet",
    clip?.mirror ? "clip-mirror-safe" : "clip-fixed-facing",
    clip?.sourceFacing === "left" ? "clip-source-left" : "clip-source-right",
    sample.moving ? "flow-moving" : "flow-stationary",
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
  if (!sample.visible) {
    syncCitizenVisibility(element, pet, onGeometryChange);
    return true;
  }

  const clip = sample.clip;
  const assetUrl = themedAssetUrl ?? (sample.held ? clip?.holdAssetUrl : clip?.assetUrl)
    ?? clip?.assetUrl
    ?? fallbackAssetUrl;
  const assetKey = JSON.stringify([assetUrl, sample.clipEpoch, sample.held]);
  if (pet.dataset.assetKey !== assetKey) {
    const request = String((Number(pet.dataset.assetRequest) || 0) + 1);
    const hasVisibleAsset = Boolean(pet.getAttribute("src")) && !pet.hidden;
    pet.dataset.assetRequest = request;
    pet.dataset.assetKey = assetKey;
    if (assetUrl) {
      if (!hasVisibleAsset) pet.hidden = true;
      syncCitizenVisibility(element, pet, onGeometryChange);
      const loader = new Image();
      loader.src = assetUrl;
      const releaseTimer = globalThis.setTimeout(() => {
        if (pet.dataset.assetRequest !== request) return;
        pet.dataset.assetReleasedKey = assetKey;
      }, ASSET_READY_TIMEOUT_MS);
      void loader.decode().then(() => {
        globalThis.clearTimeout(releaseTimer);
        if (pet.dataset.assetRequest !== request) return;
        applyPetPresentation(pet, sample);
        pet.removeAttribute("src");
        pet.src = assetUrl;
        pet.hidden = false;
        const bounds = visibleBoundsRatios(loader, assetUrl);
        pet.dataset.visibleTopRatio = String(bounds.top);
        pet.dataset.visibleBottomRatio = String(bounds.bottom);
        pet.dataset.assetReadyKey = assetKey;
        // Reveal before measuring padding; hidden image boxes otherwise report zero height.
        syncCitizenVisibility(element, pet, () => {});
        refreshCitizenLabelPosition(element);
        onGeometryChange();
      }).catch(() => {
        globalThis.clearTimeout(releaseTimer);
        if (pet.dataset.assetRequest !== request) return;
        pet.hidden = true;
        pet.removeAttribute("src");
        delete pet.dataset.visibleTopRatio;
        delete pet.dataset.visibleBottomRatio;
        refreshCitizenLabelPosition(element);
        pet.dataset.assetReadyKey = assetKey;
        syncCitizenVisibility(element, pet, onGeometryChange);
      });
    } else {
      applyPetPresentation(pet, sample);
      pet.hidden = true;
      pet.removeAttribute("src");
      delete pet.dataset.visibleTopRatio;
      delete pet.dataset.visibleBottomRatio;
      refreshCitizenLabelPosition(element);
      pet.dataset.assetReadyKey = assetKey;
      syncCitizenVisibility(element, pet, onGeometryChange);
    }
  } else if (pet.dataset.assetReadyKey === assetKey) {
    applyPetPresentation(pet, sample);
    syncCitizenVisibility(element, pet, onGeometryChange);
  }
  return pet.dataset.assetReadyKey === assetKey || pet.dataset.assetReleasedKey === assetKey;
}

export function regionFor(element: Element): HitRegion | null {
  const bounds = element.getBoundingClientRect();
  if (bounds.width <= 0 || bounds.height <= 0) return null;
  return { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height };
}
