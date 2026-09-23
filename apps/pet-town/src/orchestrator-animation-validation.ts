import { diagnostic, rejectUnknownFields, type ValidationContext } from "./flow-node-validation";
import type {
  HerdrState,
  OrchestratorAnimations,
  StateAssignment,
  StateFlowManifest,
} from "./flow-types";
import { hasOwn, isRecord } from "./flow-utils";
import { assignmentFlow } from "./state-assignment";

export function compileOrchestratorAnimations(
  input: unknown,
  statesInput: unknown,
  context: ValidationContext,
  stateAssignments: Record<HerdrState, StateAssignment>,
  compiledStates: Record<HerdrState, StateFlowManifest>,
): OrchestratorAnimations | null {
  if (input === undefined || input === null) return null;
  if (!isRecord(input)) {
    diagnostic(
      context,
      "E_ORCHESTRATOR",
      "/orchestratorAnimations",
      "Orchestrator animations must be an object",
    );
    return null;
  }
  rejectUnknownFields(context, input, ["walking", "listening"], "/orchestratorAnimations");
  const walking = typeof input.walking === "string" ? input.walking : "";
  const listening = typeof input.listening === "string" ? input.listening : "";
  if (!hasOwn(context.clips, walking) || context.clips[walking]?.role !== "locomotion") {
    diagnostic(
      context,
      "E_ORCHESTRATOR_WALK",
      "/orchestratorAnimations/walking",
      "Walking must reference a locomotion clip",
    );
  }
  if (!hasOwn(context.clips, listening)) {
    diagnostic(
      context,
      "E_ORCHESTRATOR_LISTEN",
      "/orchestratorAnimations/listening",
      "Listening must reference a clip",
    );
  }
  if (walking && walking === listening) {
    diagnostic(
      context,
      "E_ORCHESTRATOR_DISTINCT",
      "/orchestratorAnimations",
      "Walking and Listening must use different clips",
    );
  }
  if (!hasOwn(context.clips, walking) || !hasOwn(context.clips, listening)) return null;
  if (isRecord(statesInput) && statesInput.listening === undefined) {
    stateAssignments.listening = { animation: listening, action: "idle", visible: true };
    compiledStates.listening = assignmentFlow(stateAssignments.listening);
  }
  return { walking, listening };
}
