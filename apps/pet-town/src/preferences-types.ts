export const ASSISTANT_PET_ID = "mossback-turtle-monk";

export type SettingsAppearance = "system" | "light" | "dark";
export type LabelVisibility = "always" | "hover" | "hidden";
export type MotionLevel = "gentle" | "standard" | "playful";

export interface AppPreferences {
  openWithHerdr: boolean;
  settingsAppearance: SettingsAppearance;
  lastSelectedPetId: string;
  hideCompletedPets: boolean;
  completedHideDelayMinutes: number;
  orchestrator: OrchestratorPreferences;
}

export interface OrchestratorPreferences {
  enabled: boolean;
  displayName: string;
  model: "gpt-5.6-luna" | "gpt-5.6-sol" | "gpt-5.6-terra";
  thinking: "low" | "medium" | "high" | "xhigh";
  wakeEnabled: boolean;
  petId: string | null;
}

export interface PetPreferences {
  includedInRandomCast: boolean;
  appearance: { scalePercent: number; opacityPercent: number };
  labels: { visibility: LabelVisibility; textScalePercent: number };
  motion: { level: MotionLevel; reduced: boolean; pauseOnHover: boolean };
}

export interface PreferencesFile {
  schemaVersion: number;
  app: AppPreferences;
  pets: Record<string, PetPreferences>;
}

export interface PreferencesSnapshot {
  revision: number;
  preferences: PreferencesFile;
  defaults: PreferencesFile;
  petIds: string[];
  warning: string | null;
  readOnly: boolean;
}

export interface SettingsContext {
  /** Null means a general Settings entry, rather than an explicit pet. */
  selectedPetId: string | null;
  /** "app" opens Settings on the App tab with the Preview switch. Null keeps the current tab. */
  initialTab: string | null;
}

export function clonePreferences(value: PreferencesFile): PreferencesFile {
  return structuredClone(value);
}

export function preferencesEqual(left: PreferencesFile, right: PreferencesFile): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function friendlyPetName(id: string): string {
  return id
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function motionFactor(level: MotionLevel): number {
  if (level === "gentle") return 0.7;
  if (level === "playful") return 1.25;
  return 1;
}
