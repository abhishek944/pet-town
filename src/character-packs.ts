import {
  compileBehaviorPack,
  type CompiledBehaviorPack,
} from "./flow-runtime";

const manifestModules = import.meta.glob("./pets/*/flow.json", {
  eager: true,
  import: "default",
}) as Record<string, unknown>;

const assetModules = import.meta.glob("./pets/**/*.png", {
  eager: true,
  import: "default",
  query: "?url",
}) as Record<string, string>;

function assetsForManifest(manifestPath: string): Record<string, string> {
  const directory = manifestPath.slice(0, manifestPath.lastIndexOf("/"));
  const prefix = `${directory}/`;
  return Object.fromEntries(
    Object.entries(assetModules)
      .filter(([path]) => path.startsWith(prefix))
      .map(([path, url]) => [path.slice(prefix.length), url]),
  );
}

type PackSource = { manifest: unknown; assets: Record<string, string> };
const bundledSources = new Map<CharacterId, PackSource>();

const compiled = Object.entries(manifestModules)
  .map(([manifestPath, manifest]) => {
    const assets = assetsForManifest(manifestPath);
    const result = compileBehaviorPack(manifest, assets);
    if (!result.pack) {
      const messages = result.diagnostics
        .map((diagnostic) => `${diagnostic.path}: ${diagnostic.message}`)
        .join("; ");
      throw new Error(`Invalid bundled pet pack ${manifestPath}: ${messages}`);
    }
    const pathParts = manifestPath.split("/");
    const folderId = pathParts[pathParts.length - 2];
    if (result.pack.id !== folderId) {
      throw new Error(`Pet pack id ${result.pack.id} must match folder ${folderId}`);
    }
    bundledSources.set(result.pack.id, { manifest, assets });
    return result.pack;
  })
  .sort((left, right) => left.id.localeCompare(right.id));

export type CharacterId = string;

export const CHARACTER_BEHAVIOR_PACKS = Object.freeze(
  Object.fromEntries(compiled.map((pack) => [pack.id, pack])) as Readonly<
    Record<CharacterId, CompiledBehaviorPack>
  >,
);

export const CHARACTER_IDS = Object.freeze(
  compiled.map((pack) => pack.id as CharacterId),
);

export interface UserPackPayload {
  id: string;
  displayName: string;
  manifest: unknown;
  assets: Record<string, string>;
}

export interface PetExtensionPayload {
  baseId: string;
  extensionVersion: string;
  clips: Record<string, unknown>;
  states: Record<string, unknown>;
  actions: Record<string, unknown>;
  assets: Record<string, string>;
}

const userPacks = new Map<CharacterId, CompiledBehaviorPack>();
const userPackNames = new Map<CharacterId, string>();
const userSources = new Map<CharacterId, PackSource>();
const extendedPacks = new Map<CharacterId, CompiledBehaviorPack>();

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

export function compilePetExtension(extension: PetExtensionPayload) {
  const source = bundledSources.get(extension.baseId) ?? userSources.get(extension.baseId);
  const base = source ? record(structuredClone(source.manifest)) : null;
  if (!source || !base) return { pack: null, diagnostics: [{ code: "E_EXTENSION_BASE", path: "/baseId", message: "The base pet is unavailable" }] };
  const clips = record(base.clips); const states = record(base.states); const actions = record(base.actions) ?? {};
  if (!clips || !states) return { pack: null, diagnostics: [{ code: "E_EXTENSION_BASE", path: "/baseId", message: "The base pet is invalid" }] };
  base.packVersion = extension.extensionVersion;
  base.clips = { ...clips, ...extension.clips };
  base.states = { ...states, ...extension.states };
  base.actions = { ...actions, ...extension.actions };
  const result = compileBehaviorPack(base, { ...source.assets, ...extension.assets });
  if (result.pack?.id !== extension.baseId) return { pack: null, diagnostics: result.diagnostics };
  return result;
}

export function installUserPacks(
  payloads: readonly UserPackPayload[],
  extensions: readonly PetExtensionPayload[] = [],
): { rejectedPacks: string[]; rejectedExtensions: string[] } {
  userPacks.clear(); userPackNames.clear(); userSources.clear(); extendedPacks.clear();
  const rejectedPacks: string[] = []; const rejectedExtensions: string[] = [];
  for (const payload of payloads) {
    if (CHARACTER_BEHAVIOR_PACKS[payload.id]) { rejectedPacks.push(payload.id); continue; }
    const result = compileBehaviorPack(payload.manifest, payload.assets);
    if (!result.pack || result.pack.id !== payload.id) { rejectedPacks.push(payload.id); continue; }
    userPacks.set(payload.id, result.pack);
    userPackNames.set(payload.id, payload.displayName);
    userSources.set(payload.id, { manifest: payload.manifest, assets: payload.assets });
  }
  for (const extension of extensions) {
    const result = compilePetExtension(extension);
    if (!result.pack) { rejectedExtensions.push(extension.baseId); continue; }
    extendedPacks.set(extension.baseId, result.pack);
  }
  return { rejectedPacks, rejectedExtensions };
}

export function allCharacterIds(): readonly CharacterId[] {
  return [...CHARACTER_IDS, ...userPacks.keys()];
}

export function characterDisplayName(id: CharacterId): string | null {
  return userPackNames.get(id) ?? null;
}

export function behaviorPackForCharacter(id: CharacterId): CompiledBehaviorPack {
  const pack = extendedPacks.get(id) ?? CHARACTER_BEHAVIOR_PACKS[id] ?? userPacks.get(id);
  if (!pack) throw new Error(`Missing pet pack for ${id}`);
  return pack;
}
