export type UpdatePhase =
  | "idle"
  | "checking"
  | "current"
  | "available"
  | "downloading"
  | "ready"
  | "preparing"
  | "installing"
  | "error";

export interface UpdateSnapshot {
  revision: number;
  phase: UpdatePhase;
  currentVersion: string;
  availableVersion: string | null;
  notes: string | null;
  downloadedBytes: number;
  totalBytes: number | null;
  error: string | null;
}

export interface PrepareInstallRequest {
  requestId: string;
}

export const busyPhases = new Set<UpdatePhase>(["preparing", "installing"]);
