import type { StudioMode } from "./settings-studio-workflow";
import type { StudioWizard } from "./settings-studio-wizard";

interface StepContext {
  wizard: StudioWizard;
  mode: StudioMode | "";
  draftId: () => string;
  startDraft: () => Promise<boolean>;
  approvedCount: () => number;
  status: (message: string, success?: boolean, fields?: string[]) => void;
  syncControls: () => void;
}

export async function advanceStudioWizard(context: StepContext): Promise<void> {
  const step = context.wizard.current();
  if (step === 0) {
    if (!context.mode) {
      context.status("Choose whether to create a new pet or extend an existing pet.", false, [
        "studio-mode",
      ]);
      return;
    }
    context.wizard.go(1);
    context.syncControls();
    return;
  }
  if (step === 1) {
    if (!context.draftId() && !(await context.startDraft())) return;
    context.wizard.go(2);
    context.syncControls();
    return;
  }
  if (step === 2) {
    if (!context.approvedCount()) {
      context.status("Import at least one APNG before continuing.", false, ["studio-animation-id"]);
      return;
    }
    context.wizard.go(3);
    context.syncControls();
  }
}
