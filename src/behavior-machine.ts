import { StateFlowMachine, type FlowAdvance, type FlowSample } from "./state-flow-machine";
import type { CompiledBehaviorPack, HerdrState, StateFlowManifest } from "./flow-types";

export type { FlowAdvance, FlowSample } from "./state-flow-machine";

function actionPack(pack: CompiledBehaviorPack, name: string): CompiledBehaviorPack {
  const action = pack.actions[name];
  const state: StateFlowManifest = { completion: "hold", flow: action.flow };
  const states = {
    idle: state,
    working: state,
    blocked: state,
    done: state,
    unknown: state,
  } satisfies Record<HerdrState, StateFlowManifest>;
  return {
    ...pack,
    fingerprint: `${pack.fingerprint}:action:${name}`,
    states,
    actions: {},
  };
}

export class BehaviorMachine {
  private readonly stateMachine: StateFlowMachine;
  private actionMachine: StateFlowMachine | null = null;

  constructor(
    readonly pack: CompiledBehaviorPack,
    private readonly agentId: string,
    initialStatus: string,
  ) {
    this.stateMachine = new StateFlowMachine(pack, agentId, initialStatus);
  }

  setStatus(status: string): boolean {
    const changed = this.stateMachine.setStatus(status);
    if (changed) this.actionMachine = null;
    return changed;
  }

  startAction(name: string): boolean {
    if (this.actionMachine || !this.pack.actions[name]) return false;
    const state = this.stateMachine.sample().state;
    this.actionMachine = new StateFlowMachine(actionPack(this.pack, name), this.agentId, state);
    return true;
  }

  advance(deltaMs: number, stopAtClipBoundary = false): FlowAdvance {
    if (!this.actionMachine) return this.stateMachine.advance(deltaMs, stopAtClipBoundary);
    const action = this.actionMachine.advance(deltaMs, stopAtClipBoundary);
    if (!action.sample.held) return action;
    this.actionMachine = null;
    const resumed = this.stateMachine.advance(0, stopAtClipBoundary);
    return { ...resumed, distancePx: action.distancePx + resumed.distancePx };
  }

  sample(): FlowSample {
    return this.actionMachine?.sample() ?? this.stateMachine.sample();
  }
}
