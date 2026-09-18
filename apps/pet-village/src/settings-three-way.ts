import type { PreferencesFile } from "./preferences-types";

function same(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function mergeValue(base: unknown, local: unknown, remote: unknown): unknown {
  if (same(local, base)) return structuredClone(remote);
  if (Array.isArray(local) || !local || typeof local !== "object") return structuredClone(local);
  const baseObject = base && typeof base === "object" ? (base as Record<string, unknown>) : {};
  const remoteObject =
    remote && typeof remote === "object" ? (remote as Record<string, unknown>) : {};
  const localObject = local as Record<string, unknown>;
  const merged: Record<string, unknown> = structuredClone(remoteObject);
  for (const [key, value] of Object.entries(localObject)) {
    merged[key] = mergeValue(baseObject[key], value, remoteObject[key]);
  }
  return merged;
}

export function mergeLocalPreferenceEdits(
  base: PreferencesFile,
  local: PreferencesFile,
  remote: PreferencesFile,
): PreferencesFile {
  return mergeValue(base, local, remote) as PreferencesFile;
}
