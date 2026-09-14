export function syncCitizenVisibility(
  element: HTMLElement,
  pet: HTMLImageElement,
  onGeometryChange: () => void,
): void {
  const hidden = element.dataset.flowVisible !== "true"
    || element.dataset.preferenceHidden === "true" || pet.hidden;
  if (element.hidden === hidden) return;
  element.hidden = hidden;
  if (hidden && typeof element.dispatchEvent === "function") {
    element.dispatchEvent(new CustomEvent("citizen-hidden", { bubbles: true }));
  }
  onGeometryChange();
}

export function setPreferenceHidden(
  element: HTMLElement,
  hidden: boolean,
  onGeometryChange: () => void = () => {},
): void {
  element.dataset.preferenceHidden = String(hidden);
  const pet = element.querySelector<HTMLImageElement>("img.pet");
  if (pet) syncCitizenVisibility(element, pet, onGeometryChange);
}
