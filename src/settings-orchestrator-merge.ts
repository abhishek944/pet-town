import type { OrchestratorPreferences } from "./preferences-types";

export function mergeOrchestratorEdits(
  pending: OrchestratorPreferences,
  previous: OrchestratorPreferences,
  current: OrchestratorPreferences,
): OrchestratorPreferences {
  const merged = { ...current };
  const keys = ["enabled", "displayName", "model", "thinking", "wakeEnabled"] as const;
  for (const key of keys)
    if (pending[key] !== previous[key]) Object.assign(merged, { [key]: pending[key] });
  return merged;
}
