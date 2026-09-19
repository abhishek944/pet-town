import { invoke } from "@tauri-apps/api/core";
import { isCapabilityId, type CapabilityId, type PetDefinition } from "@pet-town/core";

export type AnimationAsset = {
  path: string;
  frames: number;
  frameWidth: number;
  frameHeight: number;
  frameDuration: number;
};

export type PetAsset = PetDefinition & {
  assets: Partial<Record<CapabilityId | "working" | "done", AnimationAsset>>;
};

type RosterPet = {
  id: string;
  name: string;
  capabilities: readonly CapabilityId[];
  assets: Partial<Record<string, AnimationAsset>>;
};

export const PETS: Record<string, PetAsset> = {};
let bundled: Record<string, PetAsset["assets"]> | null = null;

export function fallbackPetId(): string {
  return Object.keys(PETS).sort()[0] ?? "cat";
}

export function petWithFallback(petId: string): PetAsset {
  return PETS[petId] ?? PETS[fallbackPetId()];
}

function petIndex(id: string, count: number): number {
  let hash = 0;
  for (const character of id) hash = (Math.imul(hash, 31) + character.charCodeAt(0)) >>> 0;
  return count === 0 ? 0 : hash % count;
}

export function petIdFor(id: string): string {
  const ids = Object.keys(PETS).sort();
  return ids.length === 0 ? "cat" : ids[petIndex(id, ids.length)];
}

export async function loadPetRoster(): Promise<void> {
  if (bundled) return;
  const response = await fetch("/pets/roster.json");
  if (!response.ok) throw new Error("Pet roster is unavailable.");
  const roster = (await response.json()) as { pets: readonly RosterPet[] };
  for (const pet of roster.pets) {
    if (!pet.id || !pet.name) continue;
    PETS[pet.id] = {
      id: pet.id,
      name: pet.name,
      capabilities: pet.capabilities.filter((capability) => isCapabilityId(capability)),
      assets: { ...(pet.assets as PetAsset["assets"]) },
    };
  }
  bundled = Object.fromEntries(Object.entries(PETS).map(([id, pet]) => [id, { ...pet.assets }]));
  if (Object.keys(PETS).length === 0) throw new Error("Pet roster is empty.");
  for (const [id, pet] of Object.entries(PETS)) {
    if (!pet.assets.walk || !pet.assets.wave) throw new Error(`Pet ${id} is missing required art.`);
  }
}

export type CapabilityMapping = {
  petId: string;
  capability: string;
  frames: number;
  frameWidth: number;
  frameHeight: number;
  frameDuration: number;
  dataUrl: string;
};

export function installCapabilityMapping(mapping: CapabilityMapping): boolean {
  const pet = PETS[mapping.petId];
  if (!pet || !isCapabilityId(mapping.capability) || !pet.capabilities.includes(mapping.capability))
    return false;
  pet.assets[mapping.capability] = {
    path: mapping.dataUrl,
    frames: mapping.frames,
    frameWidth: mapping.frameWidth,
    frameHeight: mapping.frameHeight,
    frameDuration: mapping.frameDuration,
  };
  return true;
}

export function resetCapabilityMappings(): void {
  if (!bundled) return;
  for (const [id, pet] of Object.entries(PETS)) pet.assets = { ...(bundled[id] ?? {}) };
}

export async function loadCapabilityMappings(): Promise<readonly CapabilityMapping[]> {
  await loadPetRoster();
  resetCapabilityMappings();
  if (!("__TAURI_INTERNALS__" in window)) return [];
  const mappings = await invoke<CapabilityMapping[]>("list_capability_mappings").catch(() => []);
  for (const mapping of mappings) installCapabilityMapping(mapping);
  return mappings;
}
