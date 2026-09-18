const ERROR_ID = "studio-inline-validation-error";

function panel(): HTMLElement {
  return document.getElementById("panel-studio")!;
}

export function clearStudioValidation(): void {
  panel()
    .querySelectorAll<HTMLElement>('[aria-invalid="true"]')
    .forEach((control) => {
      control.removeAttribute("aria-invalid");
      if (control.getAttribute("aria-describedby") === ERROR_ID) {
        control.removeAttribute("aria-describedby");
      }
    });
  document.getElementById(ERROR_ID)?.remove();
}

export function showStudioValidation(message: string, ids: readonly string[]): void {
  clearStudioValidation();
  const controls = [...new Set(ids)]
    .map((id) => document.getElementById(id))
    .filter((control): control is HTMLElement => Boolean(control));
  if (!controls.length) return;
  controls.forEach((control) => {
    control.setAttribute("aria-invalid", "true");
    control.setAttribute("aria-describedby", ERROR_ID);
  });
  const error = document.createElement("small");
  error.id = ERROR_ID;
  error.className = "studio-field-error";
  error.setAttribute("role", "alert");
  error.textContent = message;
  (controls[0].closest("label") ?? controls[0].parentElement)?.append(error);
  if (!controls[0].matches(":disabled, [hidden]")) controls[0].focus();
}

export function bindStudioValidationClear(): void {
  const clearEdited = (event: Event) => {
    const control = event.target;
    if (control instanceof HTMLElement && control.getAttribute("aria-invalid") === "true") {
      control.removeAttribute("aria-invalid");
      control.removeAttribute("aria-describedby");
      if (!panel().querySelector('[aria-invalid="true"]')) {
        document.getElementById(ERROR_ID)?.remove();
      }
    }
  };
  panel().addEventListener("input", clearEdited);
  panel().addEventListener("change", clearEdited);
}
