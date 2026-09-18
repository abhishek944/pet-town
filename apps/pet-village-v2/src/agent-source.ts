import { invoke } from "@tauri-apps/api/core";
import type { AgentView } from "@pet-village/core";
import { ACTIVE_PET_ID } from "./pets";

const FIXTURES: readonly AgentView[] = [
  { id: "plum", name: "Plum", state: "working", petId: ACTIVE_PET_ID, detail: "Running" },
  { id: "idle", name: "Idle", state: "idle", petId: ACTIVE_PET_ID, detail: "Not running" },
];
const LARGE_FIXTURES: readonly AgentView[] = [
  "pi-herdr-skills-2",
  "pi-herdr-skills-1",
  "pet-village-1",
  "taxonomy-explorer-1",
  "pi-image-gen-1",
  "pet-village-2",
  "laraav-1",
  "pi-image-gen-2",
  "bloom-turbo-1",
  "Orchestrator-1",
  "open-design-1",
  "pi-loop-monitor-1",
  "Orchestrator-2",
  "highsheet-plugin-1",
  "pi-tasks-1",
].map((name, index) => ({
  id: `fixture-${index}`,
  name,
  state: "working",
  petId: ACTIVE_PET_ID,
  detail: "Large-roster visual fixture",
}));

function isNative(): boolean {
  return "__TAURI_INTERNALS__" in window;
}

function runningOnly(agents: readonly AgentView[]): readonly AgentView[] {
  return agents
    .filter((agent) => agent.state === "working")
    .map((agent) => ({ ...agent, petId: ACTIVE_PET_ID }))
    .sort((left, right) => left.id.localeCompare(right.id));
}

export async function listAgents(): Promise<readonly AgentView[] | null> {
  if (!isNative())
    return runningOnly(
      new URLSearchParams(window.location.search).get("fixture") === "large"
        ? LARGE_FIXTURES
        : FIXTURES,
    );
  try {
    return runningOnly(await invoke<AgentView[]>("list_agents"));
  } catch {
    return null;
  }
}
