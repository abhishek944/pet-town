import { containsLoop, entryCycleMinimumMs, holdOutcomes } from "./flow-analysis";
import { diagnostic, rejectUnknownFields, validateNode, type ValidationContext } from "./flow-node-validation";
import { compilePackActions } from "./pack-action-validation";
import { HERDR_STATES, LIMITS, type CompiledBehaviorPack, type HerdrState, type PackCompilation, type StateFlowManifest } from "./flow-types";
import { IDENTIFIER_PATTERN, deepFreeze, fnv1a, hasOwn, isFiniteBetween, isIntegerBetween, isRecord, normalizeAssetPath, stableStringify } from "./flow-utils";

const COMPILED_PACKS = new WeakSet<object>();

export function compileBehaviorPack(
  input: unknown,
  assets?: Readonly<Record<string, string>>,
): PackCompilation {
  const context: ValidationContext = { diagnostics: [], clips: {}, nodeCount: 0 };
  if (!isRecord(input)) {
    return { pack: null, diagnostics: [{ code: "E_MANIFEST", path: "", message: "Pack manifest must be an object" }] };
  }
  rejectUnknownFields(context, input, ["formatVersion", "id", "packVersion", "clips", "states", "actions", "orchestratorAnimations"], "");
  if (input.formatVersion !== 1) diagnostic(context, "E_FORMAT_VERSION", "/formatVersion", "Only formatVersion 1 is supported");
  if (typeof input.id !== "string" || !IDENTIFIER_PATTERN.test(input.id)) {
    diagnostic(context, "E_PACK_ID", "/id", "Pack id must be a lowercase identifier");
  }
  if (typeof input.packVersion !== "string" || input.packVersion.length < 1 || input.packVersion.length > 64) {
    diagnostic(context, "E_PACK_VERSION", "/packVersion", "Pack version must be a short non-empty string");
  }

  if (!isRecord(input.clips) || Object.keys(input.clips).length === 0) {
    diagnostic(context, "E_CLIPS", "/clips", "Pack must define at least one clip");
  } else {
    for (const [name, value] of Object.entries(input.clips)) {
      const path = `/clips/${name}`;
      if (!IDENTIFIER_PATTERN.test(name) || !isRecord(value)) {
        diagnostic(context, "E_CLIP", path, "Clip must have a lowercase identifier and object definition");
        continue;
      }
      rejectUnknownFields(context, value, ["durationMs", "role", "asset", "holdAsset", "sourceFacing", "mirror", "scale"], path);
      const durationMs = value.durationMs;
      const role = value.role;
      const assetPath = typeof value.asset === "string" ? normalizeAssetPath(value.asset) : null;
      const holdAssetPath = typeof value.holdAsset === "string" ? normalizeAssetPath(value.holdAsset) : null;
      const sourceFacing = value.sourceFacing === undefined ? "right" : value.sourceFacing;
      const mirror = value.mirror === undefined ? true : value.mirror;
      const scale = value.scale === undefined ? 1 : value.scale;
      if (!isIntegerBetween(durationMs, LIMITS.durationMinMs, LIMITS.durationMaxMs)) {
        diagnostic(context, "E_DURATION", `${path}/durationMs`, "Clip duration is outside the supported range");
      }
      if (assets && value.asset === undefined) diagnostic(context, "E_ASSET_REQUIRED", `${path}/asset`, "Bundled clips require an APNG asset");
      if (value.asset !== undefined && assetPath === null) diagnostic(context, "E_PATH_ESCAPE", `${path}/asset`, "Asset must be a safe pack-relative path");
      if (value.holdAsset !== undefined && holdAssetPath === null) diagnostic(context, "E_PATH_ESCAPE", `${path}/holdAsset`, "Hold asset must be a safe pack-relative path");
      if (assetPath && assets && !hasOwn(assets, assetPath)) diagnostic(context, "E_ASSET_MISSING", `${path}/asset`, "Referenced asset is missing from the pack");
      if (holdAssetPath && assets && !hasOwn(assets, holdAssetPath)) diagnostic(context, "E_ASSET_MISSING", `${path}/holdAsset`, "Referenced hold asset is missing from the pack");
      if (role !== "stationary" && role !== "locomotion") diagnostic(context, "E_CLIP_ROLE", `${path}/role`, "Clip role is invalid");
      if (sourceFacing !== "left" && sourceFacing !== "right") diagnostic(context, "E_SOURCE_FACING", `${path}/sourceFacing`, "Source facing is invalid");
      if (typeof mirror !== "boolean") diagnostic(context, "E_MIRROR", `${path}/mirror`, "Mirror flag must be boolean");
      if (!isFiniteBetween(scale, 0.5, 2.5)) diagnostic(context, "E_SCALE", `${path}/scale`, "Clip scale is outside the supported range");
      if (
        isIntegerBetween(durationMs, LIMITS.durationMinMs, LIMITS.durationMaxMs) &&
        (role === "stationary" || role === "locomotion") &&
        (sourceFacing === "left" || sourceFacing === "right") &&
        typeof mirror === "boolean" &&
        isFiniteBetween(scale, 0.5, 2.5)
      ) context.clips[name] = {
        name,
        durationMs,
        role,
        assetPath,
        assetUrl: assetPath && assets ? assets[assetPath] ?? null : null,
        holdAssetPath,
        holdAssetUrl: holdAssetPath && assets ? assets[holdAssetPath] ?? null : null,
        sourceFacing,
        mirror,
        scale,
      };
    }
  }

  const compiledStates = {} as Record<HerdrState, StateFlowManifest>;
  if (!isRecord(input.states)) {
    diagnostic(context, "E_STATES", "/states", "Pack must define all Herdr states");
  } else {
    for (const key of Object.keys(input.states)) {
      if (!(HERDR_STATES as readonly string[]).includes(key)) diagnostic(context, "E_STATE_UNKNOWN", `/states/${key}`, "Only canonical Herdr states may select behavior");
    }
    for (const state of HERDR_STATES) {
      const stateValue = input.states[state];
      const statePath = `/states/${state}`;
      if (!isRecord(stateValue)) {
        diagnostic(context, "E_STATE_MISSING", statePath, "Required Herdr state is missing");
        continue;
      }
      rejectUnknownFields(context, stateValue, ["completion", "flow"], statePath);
      if (stateValue.completion !== "restart" && stateValue.completion !== "hold") {
        diagnostic(context, "E_COMPLETION", `${statePath}/completion`, "Completion must be restart or hold");
      }
      const result = validateNode(stateValue.flow, `${statePath}/flow`, 1, context);
      if (result.minimumMs <= 0) diagnostic(context, "E_ZERO_TIME_CYCLE", `${statePath}/flow`, "Every state path must consume logical time");
      if (!Number.isSafeInteger(result.minimumMs) || !Number.isSafeInteger(result.maximumMs)) {
        diagnostic(context, "E_DURATION_OVERFLOW", `${statePath}/flow`, "Flow duration exceeds the safe logical-time range");
      }
      if (stateValue.completion === "restart" && result.node) {
        const firstCycleMs = entryCycleMinimumMs(result.node, context.clips);
        if (
          firstCycleMs < LIMITS.restartMinMs ||
          firstCycleMs > LIMITS.restartMaxMs ||
          (result.maximumMs !== Number.MAX_SAFE_INTEGER && result.maximumMs > LIMITS.restartMaxMs)
        ) diagnostic(context, "E_STATE_CYCLE_DURATION", statePath, "Restarting state cycle is outside the supported duration range");
      }
      if ((stateValue.completion === "restart" || stateValue.completion === "hold") && result.node) {
        compiledStates[state] = { completion: stateValue.completion, flow: result.node };
      }
    }
  }

  for (const state of HERDR_STATES) {
    const compiledState = compiledStates[state];
    if (compiledState?.completion !== "hold") continue;
    if (containsLoop(compiledState.flow)) {
      diagnostic(context, "E_HOLD_LOOP", `/states/${state}/flow`, "Hold states cannot contain a loop");
      continue;
    }
    const outcomes = holdOutcomes(compiledState.flow, new Set([null]));
    for (const outcome of outcomes) {
      if (outcome === null) {
        diagnostic(context, "E_HOLD_TERMINAL", `/states/${state}/flow`, "Every hold path must finish with a clip or hidden");
      } else if (outcome && !context.clips[outcome]?.holdAssetPath) {
        diagnostic(context, "E_HOLD_ASSET", `/states/${state}/flow`, `Held clip ${outcome} requires holdAsset`);
      }
    }
  }

  const compiledActions = compilePackActions(input.actions, context);
  let orchestratorAnimations: { walking: string; listening: string } | null = null;
  if (input.orchestratorAnimations !== undefined && input.orchestratorAnimations !== null) {
    const value = input.orchestratorAnimations;
    if (!isRecord(value)) {
      diagnostic(context, "E_ORCHESTRATOR", "/orchestratorAnimations", "Orchestrator animations must be an object");
    } else {
      rejectUnknownFields(context, value, ["walking", "listening"], "/orchestratorAnimations");
      const walking = typeof value.walking === "string" ? value.walking : "";
      const listening = typeof value.listening === "string" ? value.listening : "";
      if (!hasOwn(context.clips, walking) || context.clips[walking]?.role !== "locomotion") {
        diagnostic(context, "E_ORCHESTRATOR_WALK", "/orchestratorAnimations/walking", "Walking must reference a locomotion clip");
      }
      if (!hasOwn(context.clips, listening)) {
        diagnostic(context, "E_ORCHESTRATOR_LISTEN", "/orchestratorAnimations/listening", "Listening must reference a clip");
      }
      if (walking && walking === listening) {
        diagnostic(context, "E_ORCHESTRATOR_DISTINCT", "/orchestratorAnimations", "Walking and Listening must use different clips");
      }
      if (hasOwn(context.clips, walking) && hasOwn(context.clips, listening)) {
        orchestratorAnimations = { walking, listening };
      }
    }
  }

  if (context.diagnostics.length > 0 || HERDR_STATES.some((state) => !hasOwn(compiledStates, state))) {
    return { pack: null, diagnostics: context.diagnostics };
  }
  const fingerprint = fnv1a(stableStringify(input)).toString(16).padStart(8, "0");
  const pack: CompiledBehaviorPack = deepFreeze({
    formatVersion: 1,
    id: input.id as string,
    packVersion: input.packVersion as string,
    fingerprint,
    clips: context.clips,
    states: compiledStates,
    actions: compiledActions,
    orchestratorAnimations,
  });
  COMPILED_PACKS.add(pack);
  return { pack, diagnostics: [] };
}

export function isCompiledPack(value: unknown): value is CompiledBehaviorPack {
  return isRecord(value) && COMPILED_PACKS.has(value);
}
