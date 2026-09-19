import { CAPABILITIES } from "./capabilities";
import type { ActionIntent, AgentState, AgentView, Interaction, PetDefinition } from "./types";

const IMMEDIATE_STATES = new Set<AgentState>(["working", "blocked"]);
const SAFE_BEAT_LIMIT_MS = 2_000;

export class InteractionCoordinator {
  readonly #reservations = new Map<string, string>();
  readonly #cooldowns = new Map<string, number>();
  readonly #interactions = new Map<string, Interaction>();

  constructor(readonly pets: Readonly<Record<string, PetDefinition>>) {}

  canStart(intent: ActionIntent, agents: readonly AgentView[], now = Date.now()): string | null {
    const ids = [intent.actorId, intent.targetId].filter((id): id is string => Boolean(id));
    const participants = ids.map((id) => agents.find((agent) => agent.id === id));
    if (participants.some((agent) => !agent)) return "A participant is no longer available.";
    const actor = participants[0];
    if (!actor || !this.pets[actor.petId]?.capabilities.includes(intent.capability))
      return "That capability is not ready for this pet.";
    const capability = CAPABILITIES[intent.capability];
    if (capability.requiresTarget && !intent.targetId) return "That action needs a target pet.";
    if (capability.requiresItem && intent.item !== "ball")
      return "That action needs a supported item.";
    if (
      intent.capability !== "wave" &&
      participants.some(
        (agent) => agent && (agent.state === "working" || agent.state === "blocked"),
      )
    )
      return "Working or blocked pets cannot start social actions.";
    if (ids.some((id) => this.#reservations.has(id))) return "A participant is already busy.";
    const cooldownKey = `${intent.actorId}:${intent.capability}`;
    if ((this.#cooldowns.get(cooldownKey) ?? 0) > now) return "That action is cooling down.";
    return null;
  }

  start(intent: ActionIntent, agents: readonly AgentView[], now = Date.now()): Interaction {
    const blocked = this.canStart(intent, agents, now);
    if (blocked) throw new Error(blocked);
    const participantIds = [intent.actorId, intent.targetId].filter((id): id is string =>
      Boolean(id),
    );
    const interaction: Interaction = {
      id: `${intent.actorId}-${intent.capability}-${now}`,
      intent,
      participantIds,
      startedAt: now,
      safeBeatAt: now + Math.min(SAFE_BEAT_LIMIT_MS, 900),
    };
    for (const id of participantIds) this.#reservations.set(id, interaction.id);
    this.#interactions.set(interaction.id, interaction);
    return interaction;
  }

  shouldInterrupt(interaction: Interaction, state: AgentState, now = Date.now()): boolean {
    return IMMEDIATE_STATES.has(state) || now >= interaction.safeBeatAt;
  }

  finish(id: string, now = Date.now()): void {
    const interaction = this.#interactions.get(id);
    if (!interaction) return;
    for (const participant of interaction.participantIds) this.#reservations.delete(participant);
    this.#cooldowns.set(
      `${interaction.intent.actorId}:${interaction.intent.capability}`,
      now + CAPABILITIES[interaction.intent.capability].cooldownMs,
    );
    this.#interactions.delete(id);
  }

  activeFor(agentId: string): Interaction | undefined {
    const interactionId = this.#reservations.get(agentId);
    return interactionId ? this.#interactions.get(interactionId) : undefined;
  }
}
