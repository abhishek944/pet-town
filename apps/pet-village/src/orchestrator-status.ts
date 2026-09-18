export type OrchestratorStatus = {
  available: boolean;
  petReady: boolean;
  liveConnected: boolean;
  herdrConnected: boolean;
  piConnected: boolean;
  piModel: string | null;
  piThinking: string | null;
  listening: boolean;
  taskActive: boolean;
  activeTaskId: string | null;
  wakeActivated: boolean;
  wakeGeneration: number;
  workspaceId: string | null;
  message: string;
};
