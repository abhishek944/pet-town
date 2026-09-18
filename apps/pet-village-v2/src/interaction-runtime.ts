import { Actor, Color, vec } from "excalibur";
import { InteractionCoordinator, type ActionIntent, type AgentView } from "@pet-village/core";
import { PETS } from "./pets";
import type { PetActor } from "./game-types";

type RuntimeInteraction = {
  props: Actor[];
  timer?: number;
  origins: Map<string, { x: number; y: number }>;
};

export class InteractionRuntime {
  readonly #coordinator = new InteractionCoordinator(PETS);
  readonly #active = new Map<string, RuntimeInteraction>();

  constructor(
    readonly actors: Map<string, PetActor>,
    readonly addActor: (actor: Actor) => void,
    readonly restore: (pet: PetActor) => void,
    readonly useCapability: (pet: PetActor, capability: ActionIntent["capability"]) => void,
    readonly reducedMotion: () => boolean,
  ) {}

  isActive(agentId: string): boolean {
    return Boolean(this.#coordinator.activeFor(agentId));
  }

  run(intent: ActionIntent, agents: readonly AgentView[]): string | null {
    const blocked = this.#coordinator.canStart(intent, agents);
    if (blocked) return blocked;
    const interaction = this.#coordinator.start(intent, agents);
    const actor = this.actors.get(intent.actorId);
    const target = intent.targetId ? this.actors.get(intent.targetId) : undefined;
    if (!actor) {
      this.#coordinator.finish(interaction.id);
      return "The acting pet is no longer available.";
    }

    const runtime: RuntimeInteraction = { props: [], origins: new Map() };
    for (const participantId of interaction.participantIds) {
      const participant = this.actors.get(participantId);
      if (participant)
        runtime.origins.set(participantId, {
          x: participant.actor.pos.x,
          y: participant.actor.pos.y,
        });
    }
    this.#active.set(interaction.id, runtime);
    this.useCapability(actor, intent.capability);

    const reduced = this.reducedMotion();
    if (intent.capability === "walk" && !reduced) {
      actor.actor.actions.moveBy(vec(80, 0), 70).moveBy(vec(-80, 0), 70);
      this.#finishLater(interaction.id, 2_500);
    } else if (intent.capability === "follow" && target && !reduced) {
      actor.actor.actions.moveTo(vec(target.actor.pos.x - 82, actor.actor.pos.y), 80);
      this.#finishLater(interaction.id, 1_800);
    } else if (intent.capability === "dance" && !reduced) {
      actor.actor.actions.moveBy(vec(30, 0), 100).moveBy(vec(-60, 0), 100).moveBy(vec(30, 0), 100);
      this.#finishLater(interaction.id, 1_400);
    } else if ((intent.capability === "throw" || intent.capability === "catch") && target) {
      const source = intent.capability === "throw" ? actor.actor : target.actor;
      const destination = intent.capability === "throw" ? target.actor : actor.actor;
      this.#ball(source, destination, interaction.id, reduced);
    } else {
      this.#finishLater(interaction.id, 1_200);
    }
    return null;
  }

  interruptFor(agentId: string, state: AgentView["state"]): void {
    const interaction = this.#coordinator.activeFor(agentId);
    if (!interaction) return;
    if (this.#coordinator.shouldInterrupt(interaction, state)) {
      this.stop(interaction.id);
      return;
    }
    window.setTimeout(
      () => {
        if (this.#coordinator.activeFor(agentId)?.id === interaction.id) this.stop(interaction.id);
      },
      Math.max(0, interaction.safeBeatAt - Date.now()),
    );
  }

  removeAgent(agentId: string): void {
    const interaction = this.#coordinator.activeFor(agentId);
    if (interaction) this.stop(interaction.id);
  }

  stop(id: string): void {
    const runtime = this.#active.get(id);
    if (!runtime) return;
    if (runtime.timer) window.clearTimeout(runtime.timer);
    for (const prop of runtime.props) prop.kill();
    for (const [participantId, origin] of runtime.origins) {
      const participant = this.actors.get(participantId);
      if (!participant) continue;
      participant.actor.actions.clearActions();
      participant.actor.pos = vec(origin.x, origin.y);
      this.restore(participant);
    }
    this.#active.delete(id);
    this.#coordinator.finish(id);
  }

  #finishLater(id: string, duration: number): void {
    const runtime = this.#active.get(id);
    if (runtime) runtime.timer = window.setTimeout(() => this.stop(id), duration);
  }

  #ball(source: Actor, destination: Actor, interactionId: string, reduced: boolean): void {
    const start = vec(source.pos.x + 24, source.pos.y - 72);
    const end = vec(destination.pos.x, destination.pos.y - 62);
    const ball = new Actor({
      pos: reduced ? vec((start.x + end.x) / 2, (start.y + end.y) / 2) : start,
      radius: 9,
      color: Color.fromHex("#f4c95d"),
    });
    ball.z = 9;
    this.addActor(ball);
    this.#active.get(interactionId)?.props.push(ball);
    if (reduced) this.#finishLater(interactionId, 700);
    else ball.actions.moveTo(end, 180).callMethod(() => this.stop(interactionId));
  }
}
