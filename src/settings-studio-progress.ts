export type StudioBusyOperation = "generate-sheet" | "create-animation" | null;

type ProgressTarget = {
  buttonId: string;
  indicatorId: string;
  operation: Exclude<StudioBusyOperation, null>;
  idleLabel: string;
  busyLabel: string;
  announcement: string;
};

const targets: ProgressTarget[] = [
  {
    buttonId: "studio-generate-animation",
    indicatorId: "studio-sheet-loading",
    operation: "generate-sheet",
    idleLabel: "Generate 8-frame sheet",
    busyLabel: "Generating sheet…",
    announcement: "Generating an eight-frame sprite sheet.",
  },
  {
    buttonId: "studio-create-animation",
    indicatorId: "studio-animation-loading",
    operation: "create-animation",
    idleLabel: "Create animation",
    busyLabel: "Creating animation…",
    announcement: "Creating the APNG animation.",
  },
];

export function waitForStudioPaint(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

export function setStudioBusy(value: boolean, operation: StudioBusyOperation): void {
  const panel = document.getElementById("panel-studio")!;
  const active = value ? targets.find((target) => target.operation === operation) : undefined;
  document.getElementById("studio-operation-status")!.textContent = active?.announcement ?? "";
  panel.setAttribute("aria-busy", String(value));
  panel.dataset.busyOperation = value && operation ? operation : "";
  for (const target of targets) {
    const loading = value && operation === target.operation;
    const button = document.getElementById(target.buttonId)!;
    const indicator = document.getElementById(target.indicatorId)!;
    button.dataset.loading = String(loading);
    button.setAttribute("aria-busy", String(loading));
    button.textContent = loading ? target.busyLabel : target.idleLabel;
    indicator.hidden = !loading;
  }
}
