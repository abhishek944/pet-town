const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const LAST_STEP = 3;

export class StudioWizard {
  private step = 0;
  private focusedRoute = false;

  constructor(next: () => void) {
    $("studio-wizard-next").addEventListener("click", next);
    $("studio-wizard-previous").addEventListener("click", () => this.go(this.step - 1));
    this.render();
  }

  current(): number {
    return this.step;
  }
  go(step: number): void {
    this.step = Math.max(0, Math.min(LAST_STEP, step));
    this.render(true);
  }
  reset(): void {
    this.go(0);
  }
  setFocusedRoute(focused: boolean): void {
    this.focusedRoute = focused;
    this.render();
  }

  private render(moveFocus = false): void {
    let active: HTMLElement | undefined;
    document.querySelectorAll<HTMLElement>("[data-studio-step]").forEach((section) => {
      section.hidden = this.focusedRoute
        ? section.dataset.studioStep !== "3"
        : Number(section.dataset.studioStep) !== this.step;
      if (!section.hidden) active = section;
    });
    const navigation = $("studio-wizard-nav");
    navigation.hidden = this.focusedRoute;
    $<HTMLButtonElement>("studio-wizard-previous").disabled = this.step === 0;
    $<HTMLButtonElement>("studio-wizard-next").hidden = this.step === LAST_STEP;
    $("studio-wizard-progress").textContent = `Step ${this.step + 1} of ${LAST_STEP + 1}`;
    if (moveFocus) active?.querySelector<HTMLElement>("h2")?.focus();
  }
}
