export const AGENT_STATES = ["working", "blocked", "done", "idle", "unknown"] as const;
export type AgentState = (typeof AGENT_STATES)[number];
export type CapabilityId =
  "walk" | "throw" | "catch" | "wave" | "sleep" | "react" | "follow" | "dance";

export type AgentView = {
  id: string;
  name: string;
  state: AgentState;
  detail?: string;
  petId: string;
  focusTarget?: string;
};

export type CapabilitySpec = {
  id: CapabilityId;
  label: string;
  requiresTarget: boolean;
  requiresItem: boolean;
  cooldownMs: number;
};

export type PetDefinition = {
  id: string;
  name: string;
  capabilities: readonly CapabilityId[];
};

export type ActionIntent = {
  actorId: string;
  capability: CapabilityId;
  targetId?: string;
  item?: "ball";
};

export type IntentResolution =
  | { status: "ready"; intent: ActionIntent; summary: string }
  | { status: "ambiguous"; message: string; choices: readonly string[] }
  | { status: "invalid"; message: string };

export type Interaction = {
  id: string;
  intent: ActionIntent;
  participantIds: readonly string[];
  startedAt: number;
  safeBeatAt: number;
};
