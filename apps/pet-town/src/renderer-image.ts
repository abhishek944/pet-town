import { loadImageSource } from "./image-source";
import { visibleBoundsRatios } from "./renderer-image-bounds";

export const ASSET_READY_TIMEOUT_MS = 1_500;
interface ImageState {
  source: string;
  epoch: number | null;
  held: boolean;
  token: string;
  phase: "pending" | "ready" | "failed";
  released: boolean;
  controller?: AbortController;
  timer?: ReturnType<typeof setTimeout>;
  notify: () => void;
}
const images = new WeakMap<HTMLImageElement, ImageState>();

function cancelPreparation(state: ImageState): void {
  globalThis.clearTimeout(state.timer);
  state.controller?.abort();
  state.controller = undefined;
  state.timer = undefined;
}

/** Retire only for policy hiding/removal, never temporary first-load visibility. */
export function disposePetImage(element: HTMLElement): void {
  const pet = element.querySelector<HTMLImageElement>("img.pet");
  if (!pet) return;
  const state = images.get(pet);
  images.delete(pet);
  if (state) cancelPreparation(state);
  pet.hidden = true;
  pet.removeAttribute("src");
  pet.style.opacity = "";
  for (const key of [
    "assetKey",
    "assetReadyKey",
    "assetReleasedKey",
    "visibleTopRatio",
    "visibleBottomRatio",
  ])
    delete pet.dataset[key];
  const frozen = element.querySelector<HTMLCanvasElement>("canvas.pet-freeze");
  if (frozen) {
    frozen.width = 0;
    frozen.height = 0;
    frozen.remove();
  }
}

/** Resource readiness is reused; ordinary playback epochs still restart the displayed image. */
export function applyPetImage(
  element: HTMLElement,
  source: string,
  epoch: number | null,
  held: boolean,
  onReady: () => void,
): boolean {
  const pet = element.querySelector<HTMLImageElement>("img.pet");
  if (!pet) return true;
  let state = images.get(pet);
  if (state) state.notify = onReady;
  if (state && state.source === source && state.epoch === epoch && state.held === held)
    return state.phase !== "pending" || state.released;
  const sourceChanged = state?.source !== source;
  state ??= { source, epoch, held, token: "", phase: "failed", released: false, notify: onReady };
  images.set(pet, state);
  state.source = source;
  state.epoch = epoch;
  state.held = held;
  state.token = String((Number(pet.dataset.assetRequest) || 0) + 1);
  pet.dataset.assetRequest = state.token;
  pet.dataset.assetKey = state.token;
  delete pet.dataset.assetReleasedKey;
  if (!sourceChanged && state.phase === "pending") {
    if (state.released) pet.dataset.assetReleasedKey = state.token;
    return state.released;
  }
  const current = state;
  const display = () => {
    pet.removeAttribute("src");
    pet.src = current.source;
    pet.hidden = false;
    current.phase = "ready";
    pet.dataset.assetReadyKey = current.token;
    current.notify();
  };
  if (!sourceChanged && current.phase === "ready") {
    display();
    return true;
  }
  cancelPreparation(current);
  const failed = () => {
    cancelPreparation(current);
    current.phase = "failed";
    pet.hidden = true;
    pet.removeAttribute("src");
    delete pet.dataset.visibleTopRatio;
    delete pet.dataset.visibleBottomRatio;
    pet.dataset.assetReadyKey = current.token;
    current.notify();
  };
  if (!source) {
    failed();
    return true;
  }
  current.phase = "pending";
  current.released = false;
  if (!pet.getAttribute("src")) pet.hidden = true;
  const controller = new AbortController();
  current.controller = controller;
  const isCurrent = () => images.get(pet) === current && current.controller === controller;
  current.timer = globalThis.setTimeout(() => {
    if (!isCurrent()) return;
    current.released = true;
    pet.dataset.assetReleasedKey = current.token;
  }, ASSET_READY_TIMEOUT_MS);
  void loadImageSource(source, controller.signal).then(
    (loader) => {
      try {
        if (!isCurrent()) return;
        const bounds = visibleBoundsRatios(loader, source);
        pet.dataset.visibleTopRatio = String(bounds.top);
        pet.dataset.visibleBottomRatio = String(bounds.bottom);
        cancelPreparation(current);
        display();
      } finally {
        loader.removeAttribute("src");
      }
    },
    () => {
      if (isCurrent()) failed();
    },
  );
  return false;
}
