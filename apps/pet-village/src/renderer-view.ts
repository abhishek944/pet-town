import type { FlowSample } from "./flow-runtime";
import type { CitizenState } from "./village";
import { syncCitizenVisibility } from "./renderer-visibility";
export { setPreferenceHidden } from "./renderer-visibility";

export interface HitRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const ASSET_READY_TIMEOUT_MS = 1_500;
export const CITIZEN_TRACK_WIDTH = 104;
export const SUSPENSION_GAP_MS = 250;

const visibleTopRatioByAsset = new Map<string, number>();

function visibleTopRatio(image: HTMLImageElement, assetUrl: string): number {
  const cached = visibleTopRatioByAsset.get(assetUrl);
  if (cached !== undefined) return cached;
  try {
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context || canvas.height < 1) return 0;
    context.drawImage(image, 0, 0);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let top = 0;
    outer: for (; top < canvas.height; top += 1) {
      for (let x = 0; x < canvas.width; x += 1) {
        if (pixels[(top * canvas.width + x) * 4 + 3] > 8) break outer;
      }
    }
    const ratio = top < canvas.height ? top / canvas.height : 0;
    visibleTopRatioByAsset.set(assetUrl, ratio);
    return ratio;
  } catch {
    return 0;
  }
}

export function refreshCitizenLabelPosition(element: HTMLElement): void {
  const pet = element.querySelector<HTMLImageElement>("img.pet");
  const project = element.querySelector<HTMLElement>(".project");
  const ratio = Number(pet?.dataset.visibleTopRatio ?? 0);
  if (!pet || !project || !Number.isFinite(ratio)
    || typeof pet.getBoundingClientRect !== "function") return;
  const height = pet.getBoundingClientRect().height;
  project.style.setProperty("--label-offset-y", `${(height * ratio).toFixed(2)}px`);
}

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
  element.dataset.status = citizen.status;
  element.dataset.doneSinceMs = citizen.doneSinceMs === null ? "" : String(citizen.doneSinceMs);
  const announced = citizen.source === "orchestrator"
    ? (citizen.status === "blocked" ? "Listening" : "Walking") : citizen.status;
  element.setAttribute("aria-label", `${citizen.label}, ${announced}`);

  const project = element.querySelector<HTMLElement>(".project");
  if (project && project.textContent !== citizen.label) project.textContent = citizen.label;
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
): boolean {
  const pet = element.querySelector<HTMLImageElement>("img.pet");
  if (!pet) return true;

  element.dataset.flowVisible = String(sample.visible);
  if (!sample.visible) {
    syncCitizenVisibility(element, pet, onGeometryChange);
    return true;
  }

  const clip = sample.clip;
  const assetUrl = (sample.held ? clip?.holdAssetUrl : clip?.assetUrl)
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
        pet.dataset.visibleTopRatio = String(visibleTopRatio(loader, assetUrl));
        pet.dataset.assetReadyKey = assetKey;
        refreshCitizenLabelPosition(element);
        syncCitizenVisibility(element, pet, onGeometryChange);
      }).catch(() => {
        globalThis.clearTimeout(releaseTimer);
        if (pet.dataset.assetRequest !== request) return;
        pet.hidden = true;
        pet.removeAttribute("src");
        pet.dataset.assetReadyKey = assetKey;
        syncCitizenVisibility(element, pet, onGeometryChange);
      });
    } else {
      applyPetPresentation(pet, sample);
      pet.hidden = true;
      pet.removeAttribute("src");
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
