import { invoke } from "@tauri-apps/api/core";
import { isCapabilityId, type CapabilityId, type PetDefinition } from "@pet-village/core";

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

export const ACTIVE_PET_ID = "plum-dragon";

export const PETS: Record<string, PetAsset> = {
  [ACTIVE_PET_ID]: {
    id: ACTIVE_PET_ID,
    name: "Plum Dragon",
    capabilities: ["walk", "wave"],
    assets: {
      walk: {
        path: "/pets/plum-dragon/walk.png",
        frames: 6,
        frameWidth: 256,
        frameHeight: 256,
        frameDuration: 140,
      },
      wave: {
        path: "/pets/plum-dragon/wave.png",
        frames: 6,
        frameWidth: 256,
        frameHeight: 256,
        frameDuration: 150,
      },
    },
  },
};

const BUNDLED_ASSETS = Object.fromEntries(
  Object.entries(PETS).map(([id, pet]) => [
    id,
    Object.fromEntries(
      Object.entries(pet.assets).map(([key, asset]) => [key, asset && { ...asset }]),
    ),
  ]),
) as Record<string, PetAsset["assets"]>;

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
  for (const [id, pet] of Object.entries(PETS)) pet.assets = { ...BUNDLED_ASSETS[id] };
}

export async function loadCapabilityMappings(): Promise<readonly CapabilityMapping[]> {
  resetCapabilityMappings();
  if (!("__TAURI_INTERNALS__" in window)) return [];
  const mappings = await invoke<CapabilityMapping[]>("list_capability_mappings").catch(() => []);
  for (const mapping of mappings) installCapabilityMapping(mapping);
  return mappings;
}
