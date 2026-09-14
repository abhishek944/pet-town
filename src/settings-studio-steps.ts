import type { StudioMode } from "./settings-studio-workflow";
import type { StudioWizard } from "./settings-studio-wizard";

interface StepContext {
  wizard: StudioWizard;
  mode: StudioMode | "";
  draftId: () => string;
  startDraft: () => Promise<boolean>;
  referenceReady: () => boolean;
  approvedCount: () => number;
  status: (message: string) => void;
  syncControls: () => void;
}

export async function advanceStudioWizard(context: StepContext): Promise<void> {
  const step = context.wizard.current();
  if (step === 0) {
    if (!context.mode) {
      context.status("Choose whether to create a new pet or extend an existing pet.");
      return;
    }
    context.wizard.go(1);
    context.syncControls();
    return;
  }
  if (step === 1) {
    if (!context.draftId() && !(await context.startDraft())) return;
    if (!context.referenceReady()) {
      context.status("Generate and review the character reference before continuing.");
      return;
    }
    context.wizard.go(2);
    context.syncControls();
    return;
  }
  if (step === 2) {
    if (!context.approvedCount()) {
      context.status("Create or import and approve at least one APNG before continuing.");
      return;
    }
    context.wizard.go(3);
    context.syncControls();
  }
}
