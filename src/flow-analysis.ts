import type { CompiledClip, FlowNode } from "./flow-types";

export type HoldOutcome = string | null;

export function holdOutcomes(
  node: FlowNode,
  inputs: ReadonlySet<HoldOutcome>,
): Set<HoldOutcome> {
  if (node.type === "play" || node.type === "move") return new Set([node.clip]);
  if (node.type === "loop") return holdOutcomes(node.flow, inputs);
  if (node.type === "hide") return new Set([""]);
  if (node.type === "wait") return new Set(inputs);
  if (node.type === "sequence") {
    return node.steps.reduce<Set<HoldOutcome>>(
      (outcomes, step) => holdOutcomes(step, outcomes),
      new Set(inputs),
    );
  }
  if (node.type === "repeat") {
    let outcomes = new Set(inputs);
    for (let count = 0; count < node.count; count += 1) {
      outcomes = holdOutcomes(node.flow, outcomes);
    }
    return outcomes;
  }
  const outcomes = new Set<HoldOutcome>();
  for (const choice of node.choices) {
    for (const outcome of holdOutcomes(choice.flow, inputs)) outcomes.add(outcome);
  }
  return outcomes;
}

export function containsLoop(node: FlowNode): boolean {
  if (node.type === "loop") return true;
  if (node.type === "sequence") return node.steps.some(containsLoop);
  if (node.type === "repeat") return containsLoop(node.flow);
  if (node.type === "choose") return node.choices.some((choice) => containsLoop(choice.flow));
  return false;
}

export function entryCycleMinimumMs(
  node: FlowNode,
  clips: Readonly<Record<string, CompiledClip>>,
): number {
  if (node.type === "sequence") {
    let total = 0;
    for (const step of node.steps) {
      total += entryCycleMinimumMs(step, clips);
      if (containsLoop(step)) break;
    }
    return total;
  }
  if (node.type === "repeat") return containsLoop(node.flow)
    ? entryCycleMinimumMs(node.flow, clips)
    : entryCycleMinimumMs(node.flow, clips) * node.count;
  if (node.type === "choose") {
    return Math.min(...node.choices.map((choice) => entryCycleMinimumMs(choice.flow, clips)));
  }
  if (node.type === "loop") return entryCycleMinimumMs(node.flow, clips);
  if (node.type === "play") return (clips[node.clip]?.durationMs ?? 0) * (node.count ?? 1);
  return node.durationMs;
}
