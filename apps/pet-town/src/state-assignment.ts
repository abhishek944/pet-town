import type { HerdrState, StateAssignment, StateFlowManifest } from "./flow-types";

export function legacyAssignment(
  flow: StateFlowManifest["flow"],
  state: HerdrState,
): StateAssignment {
  if (state === "idle" || state === "unknown")
    return { animation: null, action: "idle", visible: false };
  const clips: Array<{ animation: string; action: StateAssignment["action"] }> = [];
  const collect = (node: StateFlowManifest["flow"]): void => {
    if (node.type === "play" || node.type === "move") {
      clips.push({ animation: node.clip, action: node.type === "move" ? "walking" : "idle" });
    } else if (node.type === "sequence") node.steps.forEach(collect);
    else if (node.type === "loop" || node.type === "repeat") collect(node.flow);
    else if (node.type === "choose") node.choices.forEach((choice) => collect(choice.flow));
  };
  collect(flow);
  const selected =
    state === "done"
      ? clips[clips.length - 1]
      : state === "working"
        ? (clips.find((clip) => clip.action === "walking") ?? clips[0])
        : clips[0];
  return selected
    ? {
        animation: selected.animation,
        action: state === "working" ? selected.action : "idle",
        visible: true,
      }
    : { animation: null, action: "idle", visible: false };
}

export function assignmentFlow(value: StateAssignment): StateFlowManifest {
  if (!value.visible) return { completion: "restart", flow: { type: "hide", durationMs: 1000 } };
  if (value.action === "walking")
    return {
      completion: "restart",
      flow: {
        type: "move",
        clip: value.animation!,
        durationMs: 2400,
        speedPxPerSecond: value.speedPxPerSecond ?? 30,
      },
    };
  return { completion: "restart", flow: { type: "play", clip: value.animation! } };
}
