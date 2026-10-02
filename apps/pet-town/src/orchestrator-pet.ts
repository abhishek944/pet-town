import { bundledBehaviorPackForCharacter } from "./character-packs";
import type { CompiledBehaviorPack, StateFlowManifest } from "./flow-runtime";
import type { CitizenState } from "./village";

export interface OrchestratorView {
  active: boolean;
  citizenId: string | null;
  petId: string | null;
  displayName: string;
  listening: boolean;
  working?: boolean;
  speaking?: boolean;
}

export function validOrchestratorView(view: OrchestratorView | null): OrchestratorView | null {
  if (!view) return null;
  try {
    return view.petId && bundledBehaviorPackForCharacter(view.petId).orchestratorAnimations
      ? view
      : null;
  } catch {
    return null;
  }
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
    status: view.speaking
      ? "speaking"
      : view.listening
        ? "listening"
        : view.working
          ? "working"
          : "idle",
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
  const baseWorking = base.states.working.flow;
  const walking: StateFlowManifest = {
    completion: "restart",
    flow: {
      type: "move",
      clip: mapping.walking,
      durationMs: 2400,
      speedPxPerSecond: baseWorking.type === "move" ? baseWorking.speedPxPerSecond : 30,
    },
  };
  const listening: StateFlowManifest = {
    completion: "restart",
    flow: { type: "play", clip: mapping.listening },
  };
  const speaking: StateFlowManifest = {
    completion: "restart",
    flow: { type: "play", clip: mapping.speaking ?? mapping.listening },
  };
  return Object.freeze({
    ...base,
    fingerprint: `${base.fingerprint}:orchestrator`,
    stateAssignments: Object.freeze({
      ...base.stateAssignments,
      idle: { animation: mapping.walking, action: "walking" as const, visible: true },
      working: { animation: mapping.walking, action: "walking" as const, visible: true },
      done: { animation: mapping.walking, action: "walking" as const, visible: true },
      unknown: { animation: mapping.walking, action: "walking" as const, visible: true },
      listening: { animation: mapping.listening, action: "idle" as const, visible: true },
      speaking: {
        animation: mapping.speaking ?? mapping.listening,
        action: "idle" as const,
        visible: true,
      },
    }),
    states: Object.freeze({
      idle: walking,
      working: walking,
      blocked: base.states.blocked,
      done: walking,
      unknown: walking,
      listening,
      speaking,
    }),
  });
}
