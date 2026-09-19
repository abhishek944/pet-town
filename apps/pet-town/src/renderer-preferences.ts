import { motionFactor, type PetPreferences, type PreferencesFile } from "./preferences-types";
import type { CitizenState } from "./village";

const FALLBACK: PetPreferences = {
  includedInRandomCast: true,
  appearance: { scalePercent: 100, opacityPercent: 100 },
  labels: { visibility: "always", textScalePercent: 100 },
  motion: { level: "standard", reduced: false, pauseOnHover: false },
};

export function preferencesFor(
  element: HTMLElement,
  preferences: PreferencesFile | null,
): PetPreferences {
  const id = element.dataset.characterId ?? "";
  return preferences?.pets[id] ?? FALLBACK;
}

export function applyCitizenPreferences(
  element: HTMLElement,
  baseSize: number,
  preferences: PreferencesFile | null,
): void {
  const value = preferencesFor(element, preferences);
  const preferredSize = (44 * value.appearance.scalePercent) / 100;
  element.style.setProperty("--citizen-size", `${Math.min(baseSize, preferredSize)}px`);
  element.style.setProperty("--citizen-opacity", String(value.appearance.opacityPercent / 100));
  element.style.setProperty("--label-scale", String(value.labels.textScalePercent / 100));
  element.dataset.labelVisibility = value.labels.visibility;
}

export function shouldHideCompleted(
  citizen: CitizenState,
  preferences: PreferencesFile | null,
  nowMs = Date.now(),
): boolean {
  if (
    !preferences?.app.hideCompletedPets ||
    citizen.status !== "done" ||
    citizen.doneSinceMs === null
  )
    return false;
  const delayMs = preferences.app.completedHideDelayMinutes * 60_000;
  return nowMs - citizen.doneSinceMs >= delayMs;
}

export function shouldHideCompletedElement(
  element: HTMLElement,
  preferences: PreferencesFile | null,
  nowMs = Date.now(),
): boolean {
  const doneSinceMs = Number(element.dataset.doneSinceMs);
  return Boolean(
    preferences?.app.hideCompletedPets &&
    element.dataset.status === "done" &&
    element.dataset.doneSinceMs &&
    nowMs - doneSinceMs >= preferences.app.completedHideDelayMinutes * 60_000,
  );
}

export function travelDistanceFor(
  element: HTMLElement,
  distancePx: number,
  preferences: PreferencesFile | null,
  systemReducedMotion = false,
): number {
  const motion = preferencesFor(element, preferences).motion;
  const petHovered = element.querySelector(".pet:hover") !== null;
  if (systemReducedMotion || motion.reduced || (motion.pauseOnHover && petHovered)) return 0;
  return distancePx * motionFactor(motion.level);
}
