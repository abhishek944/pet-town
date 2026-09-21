export type StudioBusyOperation =
  "prepare-draft" | "import-animation" | "discard-draft" | "save-pet" | null;

type ProgressTarget = {
  buttonId?: string;
  operation: Exclude<StudioBusyOperation, null>;
  busyLabel: string;
  announcement: string;
};

const targets: ProgressTarget[] = [
  {
    buttonId: "studio-wizard-next",
    operation: "prepare-draft",
    busyLabel: "Preparing…",
    announcement: "Preparing the pet draft.",
  },
  {
    operation: "import-animation",
    busyLabel: "Importing…",
    announcement: "Importing and validating the APNG animation.",
  },
  {
    buttonId: "studio-cancel",
    operation: "discard-draft",
    busyLabel: "Discarding draft…",
    announcement: "Discarding the pet draft.",
  },
  {
    buttonId: "studio-save",
    operation: "save-pet",
    busyLabel: "Saving…",
    announcement: "Validating and saving the pet.",
  },
];

export function waitForStudioPaint(): Promise<void> {
  return new Promise((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  );
}

export function setStudioBusy(value: boolean, operation: StudioBusyOperation): void {
  const panel = document.getElementById("panel-studio")!;
  const active = value ? targets.find((target) => target.operation === operation) : undefined;
  document.getElementById("studio-operation-status")!.textContent = active?.announcement ?? "";
  panel.setAttribute("aria-busy", String(value));
  panel.dataset.busyOperation = value && operation ? operation : "";
  for (const target of targets) {
    const loading = value && operation === target.operation;
    if (!target.buttonId) continue;
    const button = document.getElementById(target.buttonId)!;
    const wasLoading = button.dataset.loading === "true";
    if (loading && !wasLoading) {
      button.dataset.idleLabel = button.textContent ?? "";
      button.textContent = target.busyLabel;
    } else if (!loading && wasLoading) {
      button.textContent = button.dataset.idleLabel ?? button.textContent;
      delete button.dataset.idleLabel;
    }
    button.dataset.loading = String(loading);
    button.setAttribute("aria-busy", String(loading));
  }
}
