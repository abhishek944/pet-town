import type { CompiledBehaviorPack, StateFlowManifest } from "./flow-runtime";
import type { CitizenState } from "./village";

export interface OrchestratorView {
  active: boolean;
  citizenId: string | null;
  petId: string | null;
  displayName: string;
  listening: boolean;
}

export function applyOrchestratorCitizen(
  citizens: Map<string, CitizenState>,
  view: OrchestratorView | null,
): Map<string, CitizenState> {
  const prior = [...citizens.entries()].filter(([, citizen]) => citizen.source === "orchestrator");
  if (!view?.active || !view.citizenId || !view.petId) {
    prior.forEach(([id]) => citizens.delete(id));
    return citizens;
  }
  const id = view.citizenId;
  prior.filter(([priorId]) => priorId !== id).forEach(([priorId]) => citizens.delete(priorId));
  const previous = citizens.get(id);
  citizens.set(id, {
    ...previous,
    id,
    label: view.displayName,
    source: "orchestrator",
    status: view.listening ? "blocked" : "working",
    sprite: view.petId,
    missedPolls: 0,
    retiring: false,
    doneSinceMs: null,
  });
  return citizens;
}

export function orchestratorPack(base: CompiledBehaviorPack): CompiledBehaviorPack {
  const mapping = base.orchestratorAnimations;
  if (!mapping) return base;
  const walking: StateFlowManifest = {
    completion: "restart",
    flow: {
      type: "move",
      clip: mapping.walking,
      durationMs: 2400,
      speedPxPerSecond: 30,
    },
  };
  const listening: StateFlowManifest = {
    completion: "restart",
    flow: { type: "play", clip: mapping.listening },
  };
  return Object.freeze({
    ...base,
    fingerprint: `${base.fingerprint}:orchestrator`,
    actions: Object.freeze({}),
    states: Object.freeze({
      idle: walking,
      working: walking,
      blocked: listening,
      done: walking,
      unknown: walking,
    }),
  });
}
