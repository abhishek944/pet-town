import type { PetPreferences, PreferencesFile, PreferencesSnapshot } from "./preferences-types";

const byId = <T extends HTMLElement>(id: string): T => {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing settings control: ${id}`);
  return element as T;
};

function setSwitch(id: string, checked: boolean): void {
  byId<HTMLButtonElement>(id).setAttribute("aria-checked", String(checked));
}

export function setSettingsReadOnly(readOnly: boolean): void {
  const ids = [
    "pet-select",
    "pet-size",
    "pet-opacity",
    "label-visibility",
    "label-size",
    "motion-level",
    "reduced-motion",
    "pause-hover",
    "open-with-herdr",
    "settings-appearance",
  ];
  ids.forEach((id) => {
    byId<HTMLInputElement | HTMLSelectElement | HTMLButtonElement>(id).disabled = readOnly;
  });
}

export function renderChoiceControls(
  draft: PreferencesFile,
  snapshot: PreferencesSnapshot,
  item: PetPreferences,
): void {
  const includedCount = Object.values(draft.pets).filter(
    (candidate) => candidate.includedInRandomCast,
  ).length;
  setSwitch("include-random-cast", item.includedInRandomCast);
  byId<HTMLButtonElement>("include-random-cast").disabled =
    snapshot.readOnly || (item.includedInRandomCast && includedCount === 1);
  byId<HTMLElement>("cast-count").textContent =
    `${includedCount} of ${snapshot.petIds.length} pets included`;
  setSwitch("hide-completed-pets", draft.app.hideCompletedPets);
  byId<HTMLButtonElement>("hide-completed-pets").disabled = snapshot.readOnly;
  const completedDelay = byId<HTMLSelectElement>("completed-hide-delay");
  completedDelay.value = String(draft.app.completedHideDelayMinutes);
  completedDelay.disabled = snapshot.readOnly || !draft.app.hideCompletedPets;
}
