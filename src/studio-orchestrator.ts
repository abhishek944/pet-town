import { friendlyPetName } from "./preferences-types";

const select = (id: string): HTMLSelectElement => document.getElementById(id) as HTMLSelectElement;

export interface OrchestratorAnimationSelection {
  assignToOrchestrator: boolean;
  orchestratorWalk: string;
  orchestratorListening: string;
}

export class StudioOrchestrator {
  private approved = new Map<string, string>();

  constructor() {
    select("studio-orchestrator-walk").addEventListener("change", () => this.previews());
    select("studio-orchestrator-listening").addEventListener("change", () => this.previews());
    document.getElementById("studio-assign-now")?.addEventListener("click", () => {
      (document.getElementById("studio-assign-orchestrator") as HTMLInputElement).checked = true;
      (document.getElementById("studio-save") as HTMLButtonElement).click();
    });
    document.getElementById("studio-preview-sequence")?.addEventListener("click", () => this.sequence());
  }

  reset(): void {
    this.approved.clear();
    select("studio-orchestrator-walk").replaceChildren(new Option("Choose…", ""));
    select("studio-orchestrator-listening").replaceChildren(new Option("Choose…", ""));
    (document.getElementById("studio-assign-orchestrator") as HTMLInputElement).checked = true;
    this.previews();
  }

  update(approved: ReadonlyMap<string, string>): void {
    this.approved = new Map(approved);
    const names = [...approved.keys()];
    this.options(select("studio-orchestrator-walk"), names, "walk");
    this.options(select("studio-orchestrator-listening"), names, "listening");
    this.previews();
  }

  selection(): OrchestratorAnimationSelection {
    return {
      assignToOrchestrator: (document.getElementById("studio-assign-orchestrator") as HTMLInputElement).checked,
      orchestratorWalk: select("studio-orchestrator-walk").value,
      orchestratorListening: select("studio-orchestrator-listening").value,
    };
  }

  valid(): boolean {
    const value = this.selection();
    return !value.assignToOrchestrator || Boolean(value.orchestratorWalk &&
      value.orchestratorListening && value.orchestratorWalk !== value.orchestratorListening);
  }

  private sequence(): void {
    const root = document.querySelector<HTMLElement>(".studio-orchestrator")!;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      root.dataset.preview = "both"; return;
    }
    root.dataset.preview = "walking";
    window.setTimeout(() => { root.dataset.preview = "listening"; }, 900);
    window.setTimeout(() => { root.dataset.preview = "both"; }, 1_800);
  }

  private previews(): void {
    this.preview("studio-orchestrator-walk-preview", select("studio-orchestrator-walk").value);
    this.preview("studio-orchestrator-listening-preview", select("studio-orchestrator-listening").value);
  }

  private preview(id: string, animation: string): void {
    const image = document.getElementById(id) as HTMLImageElement;
    const source = this.approved.get(animation);
    if (source) { image.src = source; image.hidden = false; }
    else { image.removeAttribute("src"); image.hidden = true; }
  }

  private options(target: HTMLSelectElement, names: string[], preferred: string): void {
    const current = target.value;
    target.replaceChildren(new Option("Choose…", ""), ...names.map((name) => new Option(friendlyPetName(name), name)));
    target.value = names.includes(current) ? current : names.includes(preferred) ? preferred : "";
  }
}
