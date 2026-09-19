import { invoke } from "@tauri-apps/api/core";

export type Appearance = "system" | "light" | "dark";
export type ActivityLevel = "calm" | "balanced" | "playful";
export type V2Preferences = {
  schemaVersion: 1;
  appearance: Appearance;
  reducedMotion: boolean;
  autonomyEnabled: boolean;
  activityLevel: ActivityLevel;
  playroomEnabled: boolean;
  naturalLanguageEnabled: boolean;
  resolver: "local";
  petScale: number;
  showLabels: boolean;
};

export const DEFAULT_PREFERENCES: V2Preferences = {
  schemaVersion: 1,
  appearance: "system",
  reducedMotion: false,
  autonomyEnabled: true,
  activityLevel: "balanced",
  playroomEnabled: true,
  naturalLanguageEnabled: true,
  resolver: "local",
  petScale: 100,
  showLabels: true,
};

const KEY = "pet-town-v2.preferences";

export function clearBrowserPreferences(): void {
  localStorage.removeItem(KEY);
}

function validate(value: unknown): V2Preferences {
  if (!value || typeof value !== "object") return { ...DEFAULT_PREFERENCES };
  const candidate = value as Partial<V2Preferences>;
  return {
    ...DEFAULT_PREFERENCES,
    ...candidate,
    schemaVersion: 1,
    petScale: Math.max(75, Math.min(175, Number(candidate.petScale) || 100)),
  };
}

function isNative(): boolean {
  return "__TAURI_INTERNALS__" in window;
}

export async function loadPreferences(): Promise<V2Preferences> {
  if (isNative()) return validate(await invoke<unknown>("get_preferences"));
  const stored = localStorage.getItem(KEY);
  if (!stored) return { ...DEFAULT_PREFERENCES };
  try {
    return validate(JSON.parse(stored));
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

export async function savePreferences(value: V2Preferences): Promise<V2Preferences> {
  const preferences = validate(value);
  if (isNative()) return validate(await invoke<unknown>("apply_preferences", { preferences }));
  localStorage.setItem(KEY, JSON.stringify(preferences));
  window.dispatchEvent(new CustomEvent("pet-town-preferences", { detail: preferences }));
  return preferences;
}

export function applyAppearance(preferences: V2Preferences): void {
  document.documentElement.dataset.appearance = preferences.appearance;
  document.documentElement.classList.toggle("reduced-motion", preferences.reducedMotion);
}
