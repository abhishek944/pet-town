import { diagnostic, rejectUnknownFields, validateNode, type ValidationContext } from "./flow-node-validation";
import { ACTIONS_MAX, LIMITS, type CompiledAction } from "./flow-types";
import { IDENTIFIER_PATTERN, isRecord } from "./flow-utils";

export function compilePackActions(
  input: unknown,
  context: ValidationContext,
): Record<string, CompiledAction> {
  const actions: Record<string, CompiledAction> = {};
  if (input === undefined) return actions;
  if (!isRecord(input)) {
    diagnostic(context, "E_ACTIONS", "/actions", "Actions must be an object keyed by identifier");
    return actions;
  }
  const names = Object.keys(input);
  if (names.length > ACTIONS_MAX) {
    diagnostic(context, "E_ACTION_LIMIT", "/actions", `A pack may declare at most ${ACTIONS_MAX} actions`);
  }
  for (const name of names.slice(0, ACTIONS_MAX)) {
    const path = `/actions/${name}`;
    const value = input[name];
    if (!IDENTIFIER_PATTERN.test(name) || !isRecord(value)) {
      diagnostic(context, "E_ACTION", path, "Action must have a lowercase identifier and object definition");
      continue;
    }
    rejectUnknownFields(context, value, ["label", "flow"], path);
    const label = value.label;
    if (typeof label !== "string" || label.trim() !== label || label.length < 1 || label.length > 24) {
      diagnostic(context, "E_ACTION_LABEL", `${path}/label`, "Action label must be 1-24 trimmed characters");
    }
    const result = validateNode(value.flow, `${path}/flow`, 1, context);
    if (result.minimumMs <= 0) {
      diagnostic(context, "E_ZERO_TIME_CYCLE", `${path}/flow`, "Every action must consume logical time");
    }
    if (result.maximumMs > LIMITS.restartMaxMs) {
      diagnostic(context, "E_ACTION_DURATION", `${path}/flow`, "Actions must finish within the supported duration");
    }
    if (result.node && typeof label === "string" && label.trim() === label && label.length >= 1 && label.length <= 24) {
      actions[name] = { label, flow: result.node };
    }
  }
  return actions;
}
