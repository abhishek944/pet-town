import type { StripTheme, PreferencesFile } from "../preferences-types";
export interface Dependency {
  phase: string;
  message: string;
  version: string | null;
}
export interface Tool {
  id: string;
  label: string;
  status: string;
  readiness: string;
  message: string;
}
export interface Sample {
  phase: string;
  status: string | null;
  agentId: string | null;
  message: string | null;
  owned: boolean;
}
export interface Context {
  step: number;
  completed: boolean;
  tool: string | null;
  stripTheme: StripTheme;
  previewPreferences: PreferencesFile;
  installationReady: boolean;
  busy: boolean;
  dependency: Dependency;
  tools: Tool[];
  sample: Sample;
  hasSample: boolean;
}
export interface Actions {
  next(): Promise<void>;
  back(): Promise<void>;
  skip(): Promise<void>;
  later(): Promise<void>;
  selectTool(id: string): Promise<void>;
  selectTheme(theme: StripTheme): void;
  check(): Promise<void>;
  install(): Promise<void>;
  test(): Promise<void>;
  stop(): Promise<void>;
  handoff(destination: string): Promise<void>;
  finish(): Promise<void>;
}
