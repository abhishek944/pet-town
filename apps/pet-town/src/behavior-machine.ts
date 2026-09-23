import { StateFlowMachine, type FlowAdvance, type FlowSample } from "./state-flow-machine";
import type { CompiledBehaviorPack } from "./flow-types";

export type { FlowAdvance, FlowSample } from "./state-flow-machine";

export class BehaviorMachine {
  private readonly stateMachine: StateFlowMachine;

  constructor(
    readonly pack: CompiledBehaviorPack,
    agentId: string,
    initialStatus: string,
  ) {
    this.stateMachine = new StateFlowMachine(pack, agentId, initialStatus);
  }

  setStatus(status: string): boolean {
    return this.stateMachine.setStatus(status);
  }
  advance(deltaMs: number, stopAtClipBoundary = false): FlowAdvance {
    return this.stateMachine.advance(deltaMs, stopAtClipBoundary);
  }
  sample(): FlowSample {
    return this.stateMachine.sample();
  }
}
