export type StudioBusyOperation =
  | "prepare-draft"
  | "import-animation"
  | "generate-reference"
  | "generate-sheet"
  | "create-animation"
  | "approve-animation"
  | "discard-animation"
  | "discard-draft"
  | "save-pet"
  | null;

type ProgressTarget = {
  buttonId?: string;
  indicatorId?: string;
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
    buttonId: "studio-reference-generate",
    indicatorId: "studio-reference-loading",
    operation: "generate-reference",
    busyLabel: "Generating reference…",
    announcement: "Generating the character reference.",
  },
  {
    buttonId: "studio-generate-animation",
    indicatorId: "studio-sheet-loading",
    operation: "generate-sheet",
    busyLabel: "Generating sprite sheet…",
    announcement: "Generating one sprite sheet and preparing six animation frames.",
  },
  {
    buttonId: "studio-create-animation",
    indicatorId: "studio-animation-loading",
    operation: "create-animation",
    busyLabel: "Creating animation…",
    announcement: "Creating the APNG animation from six frames.",
  },
  {
    buttonId: "studio-approve-animation",
    operation: "approve-animation",
    busyLabel: "Approving…",
    announcement: "Approving the animation.",
  },
  {
    buttonId: "studio-discard-animation",
    operation: "discard-animation",
    busyLabel: "Discarding…",
    announcement: "Discarding the draft animation.",
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
    if (target.indicatorId) document.getElementById(target.indicatorId)!.hidden = !loading;
  }
}
