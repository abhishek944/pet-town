import type { LabelVisibility, MotionLevel, PetPreferences, PetTheme } from "../preferences-types";
import { byId } from "../settings-dom";
import { bindRange as bindInputRange, bindSwitch as bindInputSwitch } from "../settings-range";

export function bindPetControls(
  pet: () => PetPreferences,
  selectPet: (id: string) => void,
  selectPreviewAnimations: () => void,
  render: () => void,
): void {
  const petSelect = byId<HTMLSelectElement>("pet-select");
  const bindRange = (id: string, update: (value: number) => void) =>
    bindInputRange(id, update, render);
  const bindSwitch = (id: string, update: (checked: boolean) => void) =>
    bindInputSwitch(id, update, render);
  petSelect.addEventListener("change", () => {
    selectPet(petSelect.value);
    selectPreviewAnimations();
    render();
  });
  bindRange("pet-size", (value) => {
    pet().appearance.scalePercent = value;
  });
  byId<HTMLInputElement>("pet-custom-name").addEventListener("input", (event) => {
    pet().customName = (event.currentTarget as HTMLInputElement).value;
    render();
  });
  bindRange("pet-opacity", (value) => {
    pet().appearance.opacityPercent = value;
  });
  bindRange("label-size", (value) => {
    pet().labels.textScalePercent = value;
  });
  byId<HTMLSelectElement>("label-visibility").addEventListener("change", (event) => {
    pet().labels.visibility = (event.currentTarget as HTMLSelectElement).value as LabelVisibility;
    render();
  });
  byId<HTMLSelectElement>("motion-level").addEventListener("change", (event) => {
    pet().motion.level = (event.currentTarget as HTMLSelectElement).value as MotionLevel;
    render();
  });
  byId<HTMLSelectElement>("pet-theme").addEventListener("change", (event) => {
    pet().theme = (event.currentTarget as HTMLSelectElement).value as PetTheme;
    selectPreviewAnimations();
    render();
  });
  bindSwitch("pause-hover", (checked) => {
    pet().motion.pauseOnHover = checked;
  });
  bindSwitch("include-random-cast", (checked) => {
    pet().includedInRandomCast = checked;
  });
}
