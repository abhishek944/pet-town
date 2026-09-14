import {
  clonePreferences,
  preferencesEqual,
  type PreferencesFile,
  type PreferencesSnapshot,
} from "./preferences-types";

export function mergeAppliedDraft(
  current: PreferencesFile,
  submitted: PreferencesFile,
  snapshot: PreferencesSnapshot,
): { draft: PreferencesFile; message: string } {
  if (preferencesEqual(current, submitted)) {
    return { draft: clonePreferences(snapshot.preferences), message: "" };
  }
  return {
    draft: current,
    message: "Earlier changes applied; newer changes are not applied.",
  };
}

export function shouldShowApplyError(
  generation: number,
  current: number,
  revision: number,
  expected: number,
): boolean {
  return generation === current && revision === expected;
}

export function settingsMessage(operation: string, warning?: string | null): string {
  return [operation, warning]
    .filter((item, index, items) => item && items.indexOf(item) === index)
    .join(" ");
}
