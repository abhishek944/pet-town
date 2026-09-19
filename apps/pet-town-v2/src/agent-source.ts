import { invoke } from "@tauri-apps/api/core";
import type { AgentView } from "@pet-town/core";
import { PETS, petIdFor } from "./pets";

const FIXTURES: readonly AgentView[] = [
  { id: "bao", name: "Bao", state: "working", petId: "bao-panda-chef", detail: "Running" },
  { id: "idle", name: "Idle", state: "idle", petId: "cat", detail: "Not running" },
];
// Fixture agents carry explicit roster pets (kept in sync with roster.json
// ordering); live agents leave petId empty and are hash-assigned instead.
const LARGE_FIXTURES: readonly AgentView[] = [
  ["pi-herdr-skills-2", "bao-panda-chef"],
  ["pi-herdr-skills-1", "bigfoot-yeti"],
  ["pet-town-1", "brassbell-automaton-porter"],
  ["taxonomy-explorer-1", "cat"],
  ["pi-image-gen-1", "dog"],
  ["pet-town-2", "ember-fox-ronin"],
  ["laraav-1", "fern-potted-plant"],
  ["pi-image-gen-2", "gus-mail-carrier"],
  ["bloom-turbo-1", "human-male"],
  ["Orchestrator-1", "jun-clockwork-apprentice"],
  ["open-design-1", "kip-penguin-postman"],
  ["pi-loop-monitor-1", "mira-dune-spear-scout"],
  ["Orchestrator-2", "mossback-turtle-monk"],
  ["highsheet-plugin-1", "nib-dragon-hatchling"],
  ["pi-tasks-1", "pebble-slime-knight"],
  ["remediation-mma", "pudge-hedgehog"],
  ["playwright-skill", "skiff-raccoon-sky-pirate"],
  ["pi-tasks-2", "sol-capybara"],
  ["playwright-skill-2", "viking"],
  ["open-design-2", "wisp-little-ghost"],
].map(([name, petId], index) => ({
  id: `fixture-${index}`,
  name,
  state: "working",
  petId,
  detail: "Large-roster visual fixture",
}));

function isNative(): boolean {
  return "__TAURI_INTERNALS__" in window;
}

function runningOnly(agents: readonly AgentView[]): readonly AgentView[] {
  return agents
    .filter((agent) => agent.state === "working")
    .map((agent) => ({
      ...agent,
      petId: agent.petId && PETS[agent.petId] ? agent.petId : petIdFor(agent.id),
    }))
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
